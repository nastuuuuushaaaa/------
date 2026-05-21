using GuapAttractions.Api.Data;
using GuapAttractions.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<DatabaseOptions>(
    builder.Configuration.GetSection(DatabaseOptions.SectionName));

var smtpOptions = builder.Configuration.GetSection(SmtpOptions.SectionName).Get<SmtpOptions>() ?? new SmtpOptions();
builder.Services.AddSingleton(smtpOptions);
builder.Services.AddSingleton<EmailService>();
builder.Services.AddSingleton<VerificationStore>();
builder.Services.AddSingleton<PasswordResetStore>();

builder.Services.AddSingleton<SqlConnectionFactory>();
builder.Services.AddSingleton<RoutesRepository>();
builder.Services.AddSingleton<UsersRepository>();
builder.Services.AddSingleton<RouteProgressRepository>();
builder.Services.AddSingleton<QuizRepository>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // В разработке разрешаем любой origin — иначе фронт с другого порта или машины в сети отрежет CORS.
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        }
        else
        {
            policy
                .WithOrigins("http://localhost:3000")
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Локально обычно гоняем только по HTTP (см. launchSettings / --urls).
// Редирект на HTTPS в отладке только мешает и сыплет предупреждениями.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors();

app.MapControllers();

app.Run();
