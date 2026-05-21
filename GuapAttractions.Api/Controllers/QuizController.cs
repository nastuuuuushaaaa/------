using GuapAttractions.Api.Data;
using GuapAttractions.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace GuapAttractions.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuizController : ControllerBase
{
    private readonly QuizRepository _quiz;

    public QuizController(QuizRepository quiz)
    {
        _quiz = quiz;
    }

    private bool TryGetUserId(out int userId)
    {
        userId = 0;
        if (!Request.Headers.TryGetValue("X-User-Id", out var values))
            return false;
        return int.TryParse(values.FirstOrDefault(), out userId);
    }

    [HttpGet("by-route/{routeId:int}")]
    public async Task<IActionResult> GetQuizByRoute([FromRoute] int routeId, CancellationToken ct)
    {
        var quiz = await _quiz.GetQuizByRouteIdAsync(routeId, ct);
        return quiz is null ? NotFound() : Ok(quiz);
    }

    [HttpGet("{quizId:int}/questions")]
    public async Task<IActionResult> GetQuestions([FromRoute] int quizId, CancellationToken ct)
    {
        var questions = await _quiz.GetQuestionsAsync(quizId, ct);
        return Ok(questions);
    }

    [HttpPost("{quizId:int}/submit")]
    public async Task<IActionResult> SubmitQuiz(
        [FromRoute] int quizId,
        [FromBody] SubmitQuizRequest body,
        CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Отсутствует заголовок X-User-Id.");

        var questions = await _quiz.GetQuestionsAsync(quizId, ct);
        if (questions.Count == 0)
            return NotFound("Викторина не найдена.");

        var correctCount = 0;
        for (var i = 0; i < questions.Count && i < body.Answers.Count; i++)
        {
            if (body.Answers[i] == questions[i].CorrectIndex)
                correctCount++;
        }

        var result = await _quiz.SubmitResultAsync(userId, quizId, correctCount, questions.Count, ct);
        return Ok(new
        {
            result.Id,
            result.CorrectAnswers,
            result.TotalQuestions
        });
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetUserResults(CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Отсутствует заголовок X-User-Id.");

        var results = await _quiz.GetUserResultsAsync(userId, ct);
        return Ok(results);
    }
}
