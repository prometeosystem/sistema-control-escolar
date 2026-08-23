"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ExamAttemptView,
  answerExam,
  getAccessToken,
  submitExam,
} from "@/shared/api-client";
import styles from "@/features/classes/classes.module.css";

export default function ExamAttemptPage() {
  const params = useParams<{
    id: string;
    examId: string;
    attemptId: string;
  }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<ExamAttemptView | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    // Re-fetch by starting again returns same in-progress attempt
    import("@/shared/api-client").then(({ startExam }) =>
      startExam(token, params.examId)
        .then((a) => {
          setAttempt(a);
          const initial: Record<string, unknown> = {};
          for (const q of a.questions) {
            if (q.answer?.value != null) initial[q.questionId] = q.answer.value;
          }
          setAnswers(initial);
        })
        .catch((err) =>
          setError(err instanceof Error ? err.message : "No se pudo cargar"),
        ),
    );
  }, [params.examId, router]);

  async function saveAnswer(questionId: string, value: unknown) {
    const token = getAccessToken();
    if (!token || !attempt) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    try {
      await answerExam(token, attempt.id, { questionId, answer: value });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  async function onSubmit() {
    const token = getAccessToken();
    if (!token || !attempt) return;
    setLoading(true);
    try {
      const result = await submitExam(token, attempt.id);
      setAttempt(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setLoading(false);
    }
  }

  if (!attempt) {
    return (
      <main className={styles.page}>
        <p className={styles.muted}>Cargando intento…</p>
        {error ? <p className={styles.error}>{error}</p> : null}
      </main>
    );
  }

  const done = attempt.status !== "in_progress";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>SCA</p>
          <h1 className={styles.title}>Intento #{attempt.attemptNo}</h1>
          <p className={styles.muted}>
            {attempt.questions.length} preguntas
            {attempt.timeLimitMin ? ` · ${attempt.timeLimitMin} min` : ""}
            {done && attempt.score != null
              ? ` · Nota ${attempt.score}/${attempt.maxScore}`
              : ""}
            {done && attempt.passed != null
              ? attempt.passed
                ? " · Aprobado"
                : " · No aprobado"
              : ""}
          </p>
        </div>
        <Link className={styles.ghost} href={`/classes/${params.id}/exams`}>
          Volver
        </Link>
      </header>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <section className={styles.feed}>
        {attempt.questions.map((q) => (
          <article key={q.questionId} className={styles.post}>
            <h3>
              {q.position + 1}. {q.prompt}{" "}
              <span className={styles.muted}>({q.points} pts)</span>
            </h3>

            {q.type === "multiple_choice" && q.options ? (
              <div className={styles.form}>
                {q.options.map((opt) => (
                  <label key={opt.id} className={styles.label}>
                    <input
                      type="radio"
                      name={q.questionId}
                      disabled={done}
                      checked={
                        String(
                          (answers[q.questionId] as { optionId?: string })
                            ?.optionId ?? "",
                        ) === opt.id
                      }
                      onChange={() =>
                        saveAnswer(q.questionId, { optionId: opt.id })
                      }
                    />{" "}
                    {opt.text}
                  </label>
                ))}
              </div>
            ) : null}

            {q.type === "true_false" ? (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.ghost}
                  disabled={done}
                  onClick={() => saveAnswer(q.questionId, { value: true })}
                >
                  Verdadero
                </button>
                <button
                  type="button"
                  className={styles.ghost}
                  disabled={done}
                  onClick={() => saveAnswer(q.questionId, { value: false })}
                >
                  Falso
                </button>
              </div>
            ) : null}

            {(q.type === "short_answer" || q.type === "paragraph") && (
              <textarea
                className={styles.textarea}
                disabled={done}
                value={
                  String(
                    (answers[q.questionId] as { text?: string })?.text ?? "",
                  )
                }
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [q.questionId]: { text: e.target.value },
                  }))
                }
                onBlur={() =>
                  saveAnswer(q.questionId, answers[q.questionId] ?? { text: "" })
                }
              />
            )}

            {q.type === "file_upload" || q.allowFileUpload ? (
              <p className={styles.muted}>
                Podés adjuntar archivo vía API `/files` (PDF/DOC/imagen ≤ 10 MB)
                y vincularlo en la respuesta.
              </p>
            ) : null}

            {done && q.answer?.isCorrect != null ? (
              <p className={styles.muted}>
                {q.answer.isCorrect ? "Correcta" : "Incorrecta"} ·{" "}
                {q.answer.pointsAwarded ?? 0} pts
              </p>
            ) : null}
          </article>
        ))}
      </section>

      {!done ? (
        <button
          type="button"
          className={styles.button}
          disabled={loading}
          onClick={onSubmit}
        >
          {loading ? "Enviando…" : "Enviar examen"}
        </button>
      ) : null}
    </main>
  );
}
