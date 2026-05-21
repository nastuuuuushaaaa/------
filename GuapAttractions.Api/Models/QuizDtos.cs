namespace GuapAttractions.Api.Models;

public record QuizDto(int Id, int RouteId, string Title, string? Description);

public record QuizQuestionDto(
    int Id,
    int QuizId,
    string Text,
    string Option1,
    string Option2,
    string Option3,
    string Option4,
    int CorrectIndex
);

public record QuizResultDto(int Id, int UserId, int QuizId, int CorrectAnswers, int TotalQuestions);

public record SubmitQuizRequest(IReadOnlyList<int> Answers);
