using Microsoft.EntityFrameworkCore;
using IoTApi.Data;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                       ?? "Server=127.0.0.1;Database=colbergtech;User=iot_api;Password=1234;";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

builder.Services.AddIdentity<IdentityUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

if (builder.Environment.IsDevelopment())
{
    builder.Services.Configure<IdentityOptions>(options =>
    {
        options.Password.RequiredLength = 1;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequiredUniqueChars = 0;
    });
}

builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/login";
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Events.OnRedirectToLogin = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        }
        else
        {
            context.Response.Redirect(context.RedirectUri);
        }
        return Task.CompletedTask;
    };
});

var app = builder.Build();

// Auto-migrate database on startup
using (var scope = app.Services.CreateScope()) {
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Redirect("/dashboard"));

app.MapGet("/dashboard", (IWebHostEnvironment env) => {
    var webRoot = env.WebRootPath ?? "wwwroot";
    var path = Path.Combine(webRoot, "html", "Dashboard.html");
    return Results.File(path, contentType: "text/html; charset=utf-8");
}).RequireAuthorization();

app.MapGet("/login", (IWebHostEnvironment env) => {
    var webRoot = env.WebRootPath ?? "wwwroot";
    var path = Path.Combine(webRoot, "html", "Login.html");
    return Results.File(path, contentType: "text/html; charset=utf-8");
});

app.MapGet("/register", (IWebHostEnvironment env) => {
    var webRoot = env.WebRootPath ?? "wwwroot";
    var path = Path.Combine(webRoot, "html", "Register.html");
    return Results.File(path, contentType: "text/html; charset=utf-8");
});

app.MapGet("/history", (IWebHostEnvironment env) => {
    var webRoot = env.WebRootPath ?? "wwwroot";
    var path = Path.Combine(webRoot, "html", "History.html");
    return Results.File(path, contentType: "text/html; charset=utf-8");
}).RequireAuthorization();

app.MapControllers();

app.Run();
