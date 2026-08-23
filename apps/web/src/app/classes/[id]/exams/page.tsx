"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ExamSummary,
  createExam,
  getAccessToken,
  getStoredUser,
  listExams,
  publishExam,
  startExam,
} from "@/shared/api-client";
import styles from "@/features/classes/classes.module.css";

type DraftQuestion = {
  type: "multiple_choice" | "true_false" | "short_answer" | "paragraph" | "file_upload";
  prompt: string;
  points: number;
  allowFileUpload: boolean;
  optionA: string;
  optionB: string;
  correctOption: "a" | "b";
  correctBool: boolean;
  correctShort: string;
};

const emptyQ = (): DraftQuestion => ({
  type: "multiple_choice",
  prompt: "",
  points: 1,
  allowFileUpload: false,
  optionA: "Opción A",
  optionB: "Opción B",
  correctOption: "a",
  correctBool: true,
  correctShort: "",
});

export default function ClassExamsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = getStoredUser();
  const canManage = user?.role === "TEACHER" || user?.role === "ADMIN";
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [questionsPerAttempt, setQuestionsPerAttempt] = useState(2);
  const [maxAttempts, setMaxAttempts] = useState(2);
  const [minPassingScore, setMinPassingScore] = useState(6);
  const [maxScore, setMaxScore] = useState(10);
  const [autoGemini, setAutoGemini] = useState(false);
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQ(), emptyQ()]);
  const [loading, setLoading] = useState(false);

  function reload(token: string) {
    return listExams(token, params.id).then(setExams);
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    reload(token).catch((err) =>
      setError(err instanceof Error ? err.message : "Error al cargar exámenes"),
    );
  }, [params.id, router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title,
        maxScore,
        minPassingScore,
        maxAttempts,
        questionsPerAttempt,
        shuffleQuestions: true,
        shuffleOptions: true,
        allowFileAnswers: true,
        autoGradeEnabled: autoGemini,
        autoGradeProvider: autoGemini ? "gemini" : "none",
        autoGradeModel: autoGemini ? "gemini-1.5-flash" : undefined,
        questions: questions.map((q, idx) => {
          const base = {
            type: q.type,
            prompt: q.prompt,
            points: q.points,
            allowFileUpload: q.allowFileUpload || q.type === "file_upload",
            order: idx,
          };
          if (q.type === "multiple_choice") {
            return {
              ...base,
              options: [
                { id: "a", text: q.optionA },
                { id: "b", text: q.optionB },
              ],
              correctAnswer: { optionId: q.correctOption },
            };
          }
          if (q.type === "true_false") {
            return { ...base, correctAnswer: { value: q.correctBool } };
          }
          if (q.type === "short_answer") {
            return { ...base, correctAnswer: { text: q.correctShort } };
          }
          return base;
        }),
      };
      const created = (await createExam(token, params.id, payload)) as {
        id: string;
      };
      await publishExam(token, created.id);
      setTitle("");
      setQuestions([emptyQ(), emptyQ()]);
      await reload(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setLoading(false);
    }
  }

  async function onStart(examId: string) {
    const token = getAccessToken();
    if (!token) return;
    try {
      const attempt = await startExam(token, examId);
      router.push(
        `/classes/${params.id}/exams/${examId}/attempt/${attempt.id}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>SCA</p>
          <h1 className={styles.title}>Exámenes / Quizzes</h1>
          <p className={styles.muted}>
            Banco de preguntas → N aleatorias por alumno · intentos y nota mínima
            parametrizables · Gemini listo para activar
          </p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.ghost} href={`/classes/${params.id}`}>
            Muro
          </Link>
          <Link className={styles.ghost} href={`/classes/${params.id}/assignments`}>
            Tareas
          </Link>
        </div>
      </header>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {canManage ? (
        <form className={styles.form} onSubmit={onCreate} style={{ maxWidth: "40rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Nuevo quiz</h2>
          <label className={styles.label}>
            Título
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            Preguntas en el formulario (aleatorias del banco)
            <input
              className={styles.input}
              type="number"
              min={1}
              value={questionsPerAttempt}
              onChange={(e) => setQuestionsPerAttempt(Number(e.target.value))}
            />
          </label>
          <label className={styles.label}>
            Intentos máximos
            <input
              className={styles.input}
              type="number"
              min={1}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
            />
          </label>
          <label className={styles.label}>
            Puntaje máximo / mínimo para aprobar
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                className={styles.input}
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
              />
              <input
                className={styles.input}
                type="number"
                value={minPassingScore}
                onChange={(e) => setMinPassingScore(Number(e.target.value))}
              />
            </div>
          </label>
          <label className={styles.label}>
            <span>
              <input
                type="checkbox"
                checked={autoGemini}
                onChange={(e) => setAutoGemini(e.target.checked)}
              />{" "}
              Activar auto-calificación Gemini (requiere GEMINI_API_KEY en el
              servidor)
            </span>
          </label>

          {questions.map((q, idx) => (
            <div key={idx} className={styles.post}>
              <label className={styles.label}>
                Tipo
                <select
                  className={styles.input}
                  value={q.type}
                  onChange={(e) => {
                    const next = [...questions];
                    next[idx] = {
                      ...q,
                      type: e.target.value as DraftQuestion["type"],
                    };
                    setQuestions(next);
                  }}
                >
                  <option value="multiple_choice">Opción múltiple</option>
                  <option value="true_false">Verdadero/Falso</option>
                  <option value="short_answer">Respuesta corta</option>
                  <option value="paragraph">Párrafo</option>
                  <option value="file_upload">Subir archivo</option>
                </select>
              </label>
              <label className={styles.label}>
                Pregunta
                <input
                  className={styles.input}
                  value={q.prompt}
                  onChange={(e) => {
                    const next = [...questions];
                    next[idx] = { ...q, prompt: e.target.value };
                    setQuestions(next);
                  }}
                  required
                />
              </label>
              {q.type === "multiple_choice" ? (
                <>
                  <input
                    className={styles.input}
                    value={q.optionA}
                    onChange={(e) => {
                      const next = [...questions];
                      next[idx] = { ...q, optionA: e.target.value };
                      setQuestions(next);
                    }}
                  />
                  <input
                    className={styles.input}
                    value={q.optionB}
                    onChange={(e) => {
                      const next = [...questions];
                      next[idx] = { ...q, optionB: e.target.value };
                      setQuestions(next);
                    }}
                  />
                  <select
                    className={styles.input}
                    value={q.correctOption}
                    onChange={(e) => {
                      const next = [...questions];
                      next[idx] = {
                        ...q,
                        correctOption: e.target.value as "a" | "b",
                      };
                      setQuestions(next);
                    }}
                  >
                    <option value="a">Correcta: A</option>
                    <option value="b">Correcta: B</option>
                  </select>
                </>
              ) : null}
              {q.type === "true_false" ? (
                <select
                  className={styles.input}
                  value={q.correctBool ? "true" : "false"}
                  onChange={(e) => {
                    const next = [...questions];
                    next[idx] = { ...q, correctBool: e.target.value === "true" };
                    setQuestions(next);
                  }}
                >
                  <option value="true">Verdadero</option>
                  <option value="false">Falso</option>
                </select>
              ) : null}
              {q.type === "short_answer" ? (
                <input
                  className={styles.input}
                  placeholder="Respuesta correcta"
                  value={q.correctShort}
                  onChange={(e) => {
                    const next = [...questions];
                    next[idx] = { ...q, correctShort: e.target.value };
                    setQuestions(next);
                  }}
                />
              ) : null}
              <label className={styles.label}>
                <span>
                  <input
                    type="checkbox"
                    checked={q.allowFileUpload}
                    onChange={(e) => {
                      const next = [...questions];
                      next[idx] = { ...q, allowFileUpload: e.target.checked };
                      setQuestions(next);
                    }}
                  />{" "}
                  Permitir archivo en la respuesta
                </span>
              </label>
            </div>
          ))}

          <button
            type="button"
            className={styles.ghost}
            onClick={() => setQuestions((q) => [...q, emptyQ()])}
          >
            + Agregar pregunta al banco
          </button>
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Publicando…" : "Crear y publicar quiz"}
          </button>
        </form>
      ) : null}

      <ul className={styles.list}>
        {exams.map((exam) => (
          <li key={exam.id} className={styles.item}>
            <strong>{exam.title}</strong>
            <p className={styles.muted}>
              Banco {exam._count?.questions ?? "?"} · muestra{" "}
              {exam.questionsPerAttempt} · intentos {exam.maxAttempts ?? "∞"}
              {exam.minPassingScore != null
                ? ` · mínima ${exam.minPassingScore}`
                : ""}
            </p>
            {!canManage ? (
              <button
                type="button"
                className={styles.button}
                onClick={() => onStart(exam.id)}
              >
                Presentar
              </button>
            ) : (
              <Link
                className={styles.ghost}
                href={`/classes/${params.id}/exams/${exam.id}/results`}
              >
                Ver resultados
              </Link>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
