using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using System.Text.Json;
using System.Text;

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

        var httpRequest = new HttpRequestMessage
        {
            Method = new HttpMethod(request.Method),
            RequestUri = new Uri(request.Url.Raw),
            Content = new StringContent(request.Body.Raw ?? string.Empty, Encoding.UTF8, "application/json")
        };

        foreach (var header in request.Headers)
        {
            httpRequest.Headers.Add(header.Key, header.Value);
        }

        // Add Authorization header if auth type is bearer
        if (request.Authentication?.Type?.ToLower() == "bearer" && request.Authentication.Bearer != null)
        {
            var token = request.Authentication.Bearer.FirstOrDefault()?.Value;
            if (!string.IsNullOrEmpty(token))
            {
                httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            }
        }

        var response = await client.SendAsync(httpRequest);
        var responseBody = await response.Content.ReadAsStringAsync();

        return Ok(new
        {
            StatusCode = response.StatusCode,
            Headers = response.Headers.ToDictionary(h => h.Key, h => string.Join(",", h.Value)),
            Body = responseBody
        });
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

        public class Auth // New Auth class
        {
            public string Type { get; set; } = string.Empty;
            public List<BearerToken>? Bearer { get; set; }

            public class BearerToken
            {
                public string Key { get; set; } = string.Empty;
                public string Value { get; set; } = string.Empty;
                public string Type { get; set; } = string.Empty;
            }
        }
    }
}