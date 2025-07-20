using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using System.Text.Json;
using System.Text;
using System.Web;

[ApiController]
[Route("api/[controller]")]
public class PostmanController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IFileProvider _fileProvider;

    public PostmanController(IHttpClientFactory httpClientFactory, IFileProvider fileProvider)
    {
        _httpClientFactory = httpClientFactory;
        _fileProvider = fileProvider;
    }

    [HttpGet("list-files")]
    public IActionResult ListFiles()
    {
        var contents = _fileProvider.GetDirectoryContents(string.Empty);
        var files = contents.Where(f => !f.IsDirectory && f.Name.EndsWith(".json"))
                            .Select(f => f.Name)
                            .ToList();
        return Ok(files);
    }

    [HttpGet("get-file/{fileName}")]
    public IActionResult GetFile(string fileName)
    {
        var fileInfo = _fileProvider.GetFileInfo(fileName);
        if (!fileInfo.Exists)
        {
            return NotFound("File not found.");
        }

        using var stream = fileInfo.CreateReadStream();
        using var reader = new StreamReader(stream);
        var content = reader.ReadToEnd();
        return Ok(JsonSerializer.Deserialize<object>(content));
    }

    [HttpPost("execute-request")]
    public async Task<IActionResult> ExecuteRequest([FromBody] PostmanRequest request)
    {
        var client = _httpClientFactory.CreateClient();
        var startTime = DateTime.UtcNow;

        var httpRequest = new HttpRequestMessage
        {
            Method = new HttpMethod(request.Method),
            RequestUri = new Uri(request.Url.Raw),
            Content = new StringContent(request.Body.Raw ?? string.Empty, Encoding.UTF8, "application/json")
        };

        // Add headers
        foreach (var header in request.Headers)
        {
            try
            {
                httpRequest.Headers.Add(header.Key, header.Value);
            }
            catch
            {
                // Some headers need to be added to content headers
                httpRequest.Content?.Headers.Add(header.Key, header.Value);
            }
        }

        // Handle different authentication types
        if (request.Authentication != null)
        {
            await HandleAuthentication(httpRequest, request.Authentication, client);
        }

        try
        {
            var response = await client.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();
            var endTime = DateTime.UtcNow;
            var responseTime = (endTime - startTime).TotalMilliseconds;

            // Get response headers including content headers
            var allHeaders = new Dictionary<string, string>();
            foreach (var header in response.Headers)
            {
                allHeaders[header.Key] = string.Join(",", header.Value);
            }
            foreach (var header in response.Content.Headers)
            {
                allHeaders[header.Key] = string.Join(",", header.Value);
            }

            return Ok(new
            {
                StatusCode = (int)response.StatusCode,
                Headers = allHeaders,
                Body = responseBody,
                ResponseTime = responseTime,
                Size = Encoding.UTF8.GetByteCount(responseBody)
            });
        }
        catch (HttpRequestException ex)
        {
            return Ok(new
            {
                StatusCode = 0,
                Headers = new Dictionary<string, string>(),
                Body = $"Request failed: {ex.Message}",
                ResponseTime = (DateTime.UtcNow - startTime).TotalMilliseconds,
                Size = 0
            });
        }
    }

    private async Task HandleAuthentication(HttpRequestMessage request, PostmanRequest.Auth auth, HttpClient client)
    {
        switch (auth.Type?.ToLower())
        {
            case "bearer":
                var bearerToken = auth.Bearer?.FirstOrDefault()?.Value;
                if (!string.IsNullOrEmpty(bearerToken))
                {
                    request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", bearerToken);
                }
                break;

            case "basic":
                var username = auth.Basic?.FirstOrDefault(b => b.Key == "username")?.Value ?? "";
                var password = auth.Basic?.FirstOrDefault(b => b.Key == "password")?.Value ?? "";
                if (!string.IsNullOrEmpty(username))
                {
                    var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
                    request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", credentials);
                }
                break;

            case "apikey":
                var apiKey = auth.ApiKey?.FirstOrDefault();
                if (apiKey != null && !string.IsNullOrEmpty(apiKey.Key) && !string.IsNullOrEmpty(apiKey.Value))
                {
                    if (apiKey.In.ToLower() == "header")
                    {
                        request.Headers.Add(apiKey.Key, apiKey.Value);
                    }
                    else if (apiKey.In.ToLower() == "query")
                    {
                        var uriBuilder = new UriBuilder(request.RequestUri!);
                        var query = System.Web.HttpUtility.ParseQueryString(uriBuilder.Query);
                        query[apiKey.Key] = apiKey.Value;
                        uriBuilder.Query = query.ToString();
                        request.RequestUri = uriBuilder.Uri;
                    }
                }
                break;

            case "oauth2":
                if (auth.OAuth2 != null)
                {
                    var accessToken = await GetOAuth2AccessToken(auth.OAuth2, client);
                    if (!string.IsNullOrEmpty(accessToken))
                    {
                        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
                    }
                }
                break;
        }
    }

    private async Task<string?> GetOAuth2AccessToken(PostmanRequest.Auth.OAuth2Config oauth2Config, HttpClient client)
    {
        try
        {
            var tokenRequest = new List<KeyValuePair<string, string>>();

            switch (oauth2Config.GrantType.ToLower())
            {
                case "client_credentials":
                    tokenRequest.Add(new KeyValuePair<string, string>("grant_type", "client_credentials"));
                    tokenRequest.Add(new KeyValuePair<string, string>("client_id", oauth2Config.ClientId));
                    tokenRequest.Add(new KeyValuePair<string, string>("client_secret", oauth2Config.ClientSecret));
                    if (!string.IsNullOrEmpty(oauth2Config.Scope))
                        tokenRequest.Add(new KeyValuePair<string, string>("scope", oauth2Config.Scope));
                    break;

                case "password":
                    tokenRequest.Add(new KeyValuePair<string, string>("grant_type", "password"));
                    tokenRequest.Add(new KeyValuePair<string, string>("client_id", oauth2Config.ClientId));
                    tokenRequest.Add(new KeyValuePair<string, string>("client_secret", oauth2Config.ClientSecret));
                    tokenRequest.Add(new KeyValuePair<string, string>("username", oauth2Config.Username ?? ""));
                    tokenRequest.Add(new KeyValuePair<string, string>("password", oauth2Config.Password ?? ""));
                    if (!string.IsNullOrEmpty(oauth2Config.Scope))
                        tokenRequest.Add(new KeyValuePair<string, string>("scope", oauth2Config.Scope));
                    break;

                case "refresh_token":
                    tokenRequest.Add(new KeyValuePair<string, string>("grant_type", "refresh_token"));
                    tokenRequest.Add(new KeyValuePair<string, string>("client_id", oauth2Config.ClientId));
                    tokenRequest.Add(new KeyValuePair<string, string>("client_secret", oauth2Config.ClientSecret));
                    tokenRequest.Add(new KeyValuePair<string, string>("refresh_token", oauth2Config.RefreshToken ?? ""));
                    break;

                default:
                    // For authorization_code, we would need to implement a full OAuth flow
                    // This would require browser interaction and callback handling
                    return null;
            }

            var content = new FormUrlEncodedContent(tokenRequest);
            var response = await client.PostAsync(oauth2Config.AccessTokenUrl, content);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var tokenResponse = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(responseContent);
                
                if (tokenResponse != null && tokenResponse.ContainsKey("access_token"))
                {
                    return tokenResponse["access_token"].GetString();
                }
            }
        }
        catch (Exception ex)
        {
            // Log error but don't fail the request
            Console.WriteLine($"OAuth2 token request failed: {ex.Message}");
        }

        return null;
    }

    [HttpPost("save-file/{*fileName}")]
    public IActionResult SaveFile(string fileName, [FromQuery] string? collectionName, [FromQuery] string requestName, [FromBody] object updatedRequest)
    {
        var fileInfo = _fileProvider.GetFileInfo(fileName);
        if (!fileInfo.Exists)
        {
            return NotFound("File not found.");
        }

        try
        {
            var filePath = fileInfo.PhysicalPath;
            var jsonContent = System.IO.File.ReadAllText(filePath);
            var rootObject = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(jsonContent);

            if (rootObject == null || !rootObject.ContainsKey("item"))
            {
                return BadRequest("Invalid JSON structure: missing 'item' array.");
            }

            var collections = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(rootObject["item"].GetRawText());

            if (collections == null)
            {
                return BadRequest("Invalid JSON structure: 'item' is not a valid array.");
            }

            if (!string.IsNullOrEmpty(collectionName))
            {
                var collection = collections.FirstOrDefault(c => c.ContainsKey("name") && c["name"].ToString() == collectionName);
                if (collection != null && collection.ContainsKey("item"))
                {
                    var requests = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(collection["item"].ToString());
                    if (requests != null)
                    {
                        var request = requests.FirstOrDefault(r => r.ContainsKey("name") && r["name"].ToString() == requestName);
                        if (request != null)
                        {
                            request["request"] = updatedRequest;
                            collection["item"] = requests;
                        }
                        else
                        {
                            return NotFound("Request not found in the collection.");
                        }
                    }
                }
                else
                {
                    return NotFound("Collection not found.");
                }
            }
            else
            {
                var request = collections.FirstOrDefault(r => r.ContainsKey("name") && r["name"].ToString() == requestName);
                if (request != null)
                {
                    request["request"] = updatedRequest;
                }
                else
                {
                    return NotFound("Request not found.");
                }
            }

            rootObject["item"] = JsonSerializer.SerializeToElement(collections);

            var updatedJsonContent = JsonSerializer.Serialize(rootObject, new JsonSerializerOptions
            {
                WriteIndented = true
            });

            System.IO.File.WriteAllText(filePath, updatedJsonContent);
            return Ok("Request updated successfully.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error updating request: {ex.Message}");
        }
    }

    public class PostmanRequest
    {
        public string Method { get; set; } = "GET";
        public List<RequestHeader> Headers { get; set; } = new();
        public RequestBody Body { get; set; } = new();
        public RequestUrl Url { get; set; } = new();
        public Auth? Authentication { get; set; } // Added Auth property

        public class RequestHeader
        {
            public string Key { get; set; } = string.Empty;
            public string Value { get; set; } = string.Empty;
        }

        public class RequestBody
        {
            public string Mode { get; set; } = "raw";
            public string Raw { get; set; } = string.Empty;
            public RequestOptions Options { get; set; } = new();
        }

        public class RequestOptions
        {
            public RawOptions Raw { get; set; } = new();
        }

        public class RawOptions
        {
            public string Language { get; set; } = "json";
        }

        public class RequestUrl
        {
            public string Raw { get; set; } = string.Empty;
            public string Protocol { get; set; } = string.Empty;
            public List<string> Host { get; set; } = new();
            public List<string> Path { get; set; } = new();
        }

        public class Auth // Enhanced Auth class with OAuth 2.0 support
        {
            public string Type { get; set; } = string.Empty;
            public List<BearerToken>? Bearer { get; set; }
            public List<BasicAuth>? Basic { get; set; }
            public OAuth2Config? OAuth2 { get; set; }
            public List<ApiKey>? ApiKey { get; set; }

            public class BearerToken
            {
                public string Key { get; set; } = string.Empty;
                public string Value { get; set; } = string.Empty;
                public string Type { get; set; } = string.Empty;
            }

            public class BasicAuth
            {
                public string Key { get; set; } = string.Empty;
                public string Value { get; set; } = string.Empty;
                public string Type { get; set; } = string.Empty;
            }

            public class OAuth2Config
            {
                public string AccessTokenUrl { get; set; } = string.Empty;
                public string AuthUrl { get; set; } = string.Empty;
                public string ClientId { get; set; } = string.Empty;
                public string ClientSecret { get; set; } = string.Empty;
                public string? Scope { get; set; }
                public string? State { get; set; }
                public string? RedirectUri { get; set; }
                public string GrantType { get; set; } = "authorization_code";
                public string? Username { get; set; }
                public string? Password { get; set; }
                public string? RefreshToken { get; set; }
            }

            public class ApiKey
            {
                public string Key { get; set; } = string.Empty;
                public string Value { get; set; } = string.Empty;
                public string In { get; set; } = "header";
            }
        }
    }
}