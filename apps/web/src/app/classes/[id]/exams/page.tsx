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
import { AppShell } from "@/shared/ui/AppShell";
import styles from "@/features/classes/classes.module.css";

type DraftOption = {
  id: "a" | "b" | "c";
  text: string;
  weightPercent: number;
};

type DraftQuestion = {
  type: "multiple_choice" | "true_false" | "short_answer" | "paragraph" | "file_upload";
  prompt: string;
  points: number;
  allowFileUpload: boolean;
  options: DraftOption[];
  correctOption: "a" | "b" | "c";
  autoWeights: boolean;
  correctBool: boolean;
  correctShort: string;
};

const emptyQ = (): DraftQuestion => ({
  type: "multiple_choice",
  prompt: "",
  points: 1,
  allowFileUpload: false,
  options: [
    { id: "a", text: "Opción A", weightPercent: 100 },
    { id: "b", text: "Opción B", weightPercent: 0 },
    { id: "c", text: "Opción C", weightPercent: 0 },
  ],
  correctOption: "a",
  autoWeights: true,
  correctBool: true,
  correctShort: "",
});

function applyAutoWeights(
  options: DraftOption[],
  correctOption: "a" | "b" | "c",
): DraftOption[] {
  return options.map((o) => ({
    ...o,
    weightPercent: o.id === correctOption ? 100 : 0,
  }));
}

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
  const [pageLoading, setPageLoading] = useState(true);

  function reload(token: string) {
    return listExams(token, params.id).then(setExams);
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    reload(token)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar exámenes"),
      )
      .finally(() => setPageLoading(false));
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
            const options = (q.autoWeights
              ? applyAutoWeights(q.options, q.correctOption)
              : q.options
            ).map((o) => ({
              id: o.id,
              text: o.text,
              weightPercent: o.weightPercent,
            }));
            return {
              ...base,
              options,
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
    <AppShell
      title="Exámenes / Quizzes"
      lead="Banco de preguntas → N aleatorias por alumno · intentos y nota mínima parametrizables · Gemini listo para activar"
      loading={pageLoading}
      loadingLabel="Cargando exámenes…"
      actions={
        <>
          <Link className={styles.ghost} href={`/classes/${params.id}`}>
            Muro
          </Link>
          <Link className={styles.ghost} href={`/classes/${params.id}/assignments`}>
            Tareas
          </Link>
        </>
      }
    >
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
          <div className={styles.formRow}>
            <label className={styles.label}>
              Preguntas por intento (aleatorias del banco)
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
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>
              Puntaje máximo
              <input
                className={styles.input}
                type="number"
                min={1}
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
              />
            </label>
            <label className={styles.label}>
              Mínimo para aprobar
              <input
                className={styles.input}
                type="number"
                min={0}
                value={minPassingScore}
                onChange={(e) => setMinPassingScore(Number(e.target.value))}
              />
            </label>
          </div>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={autoGemini}
              onChange={(e) => setAutoGemini(e.target.checked)}
            />
            Activar auto-calificación Gemini para respuestas abiertas (requiere
            GEMINI_API_KEY en el servidor)
          </label>

          {questions.map((q, idx) => (
            <div key={idx} className={styles.questionCard}>
              <div className={styles.questionHead}>
                <span className={styles.questionBadge}>Pregunta {idx + 1}</span>
                {questions.length > 1 ? (
                  <button
                    type="button"
                    className={styles.ghost}
                    onClick={() =>
                      setQuestions((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    Quitar
                  </button>
                ) : null}
              </div>
              <div className={styles.formRow}>
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
                  Puntos de la pregunta
                  <input
                    className={styles.input}
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={q.points}
                    onChange={(e) => {
                      const next = [...questions];
                      next[idx] = { ...q, points: Number(e.target.value) || 1 };
                      setQuestions(next);
                    }}
                  />
                </label>
              </div>
              <label className={styles.label}>
                Enunciado de la pregunta
                <input
                  className={styles.input}
                  value={q.prompt}
                  onChange={(e) => {
                    const next = [...questions];
                    next[idx] = { ...q, prompt: e.target.value };
                    setQuestions(next);
                  }}
                  required
                  placeholder="Ej. ¿Cuál es la capital de Francia?"
                />
              </label>
              {q.type === "multiple_choice" ? (
                <div className={styles.optionBlock}>
                  <div className={styles.optionToolbar}>
                    <label className={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={q.autoWeights}
                        onChange={(e) => {
                          const auto = e.target.checked;
                          const next = [...questions];
                          next[idx] = {
                            ...q,
                            autoWeights: auto,
                            options: auto
                              ? applyAutoWeights(q.options, q.correctOption)
                              : q.options,
                          };
                          setQuestions(next);
                        }}
                      />
                      Asignar porcentaje automáticamente (correcta 100%, resto 0%)
                    </label>
                  </div>
                  <div className={styles.optionList}>
                    {q.options.map((opt, optIdx) => (
                      <div key={opt.id} className={styles.optionRow}>
                        <span className={styles.optionLetter}>
                          {opt.id.toUpperCase()}
                        </span>
                        <input
                          className={styles.input}
                          value={opt.text}
                          onChange={(e) => {
                            const next = [...questions];
                            const options = q.options.map((o, i) =>
                              i === optIdx ? { ...o, text: e.target.value } : o,
                            );
                            next[idx] = { ...q, options };
                            setQuestions(next);
                          }}
                          placeholder={`Texto opción ${opt.id.toUpperCase()}`}
                          aria-label={`Opción ${opt.id.toUpperCase()}`}
                        />
                        <label className={styles.weightField}>
                          %
                          <input
                            className={styles.input}
                            type="number"
                            min={0}
                            max={100}
                            disabled={q.autoWeights}
                            value={
                              q.autoWeights
                                ? opt.id === q.correctOption
                                  ? 100
                                  : 0
                                : opt.weightPercent
                            }
                            onChange={(e) => {
                              const next = [...questions];
                              const options = q.options.map((o, i) =>
                                i === optIdx
                                  ? {
                                      ...o,
                                      weightPercent: Math.min(
                                        100,
                                        Math.max(0, Number(e.target.value) || 0),
                                      ),
                                    }
                                  : o,
                              );
                              next[idx] = { ...q, options };
                              setQuestions(next);
                            }}
                            aria-label={`Porcentaje opción ${opt.id.toUpperCase()}`}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                  <label className={styles.label}>
                    Respuesta correcta
                    <select
                      className={styles.input}
                      value={q.correctOption}
                      onChange={(e) => {
                        const correctOption = e.target.value as "a" | "b" | "c";
                        const next = [...questions];
                        next[idx] = {
                          ...q,
                          correctOption,
                          options: q.autoWeights
                            ? applyAutoWeights(q.options, correctOption)
                            : q.options,
                        };
                        setQuestions(next);
                      }}
                    >
                      <option value="a">Opción A</option>
                      <option value="b">Opción B</option>
                      <option value="c">Opción C</option>
                    </select>
                  </label>
                  <p className={styles.muted}>
                    El % es sobre los {q.points} pts de la pregunta
                    {q.autoWeights
                      ? ". Modo automático: solo la correcta da el 100%."
                      : ". Podés dar crédito parcial (ej. 50%) a otras opciones."}
                  </p>
                </div>
              ) : null}
              {q.type === "true_false" ? (
                <div className={styles.optionBlock}>
                  <label className={styles.label}>
                    Respuesta correcta
                    <select
                      className={styles.input}
                      value={q.correctBool ? "true" : "false"}
                      onChange={(e) => {
                        const next = [...questions];
                        next[idx] = {
                          ...q,
                          correctBool: e.target.value === "true",
                        };
                        setQuestions(next);
                      }}
                    >
                      <option value="true">Verdadero</option>
                      <option value="false">Falso</option>
                    </select>
                  </label>
                  <p className={styles.muted}>
                    Se califica automáticamente: acertar da el 100% de los{" "}
                    {q.points} pts; equivocarse da 0.
                  </p>
                </div>
              ) : null}

              {q.type === "short_answer" ? (
                <div className={styles.optionBlock}>
                  <label className={styles.label}>
                    Respuesta correcta esperada
                    <input
                      className={styles.input}
                      placeholder="Ej. París"
                      value={q.correctShort}
                      onChange={(e) => {
                        const next = [...questions];
                        next[idx] = { ...q, correctShort: e.target.value };
                        setQuestions(next);
                      }}
                    />
                  </label>
                  <p className={styles.muted}>
                    {q.correctShort.trim()
                      ? `Coincidencia exacta (sin distinguir mayúsculas): acertar da el 100% de los ${q.points} pts.`
                      : "Si lo dejás vacío, la pregunta pasa a revisión manual del profesor."}
                  </p>
                </div>
              ) : null}

              {q.type === "paragraph" || q.type === "file_upload" ? (
                <div className={styles.optionBlock}>
                  <p className={styles.muted}>
                    {q.type === "paragraph"
                      ? `Respuesta abierta de ${q.points} pts.`
                      : `Entrega de archivo por ${q.points} pts.`}{" "}
                    {autoGemini
                      ? "Se enviará a auto-calificación con Gemini; si no está configurado, queda para revisión manual."
                      : "El profesor asigna el puntaje manualmente al revisar."}
                  </p>
                </div>
              ) : null}

              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={q.allowFileUpload || q.type === "file_upload"}
                  disabled={q.type === "file_upload"}
                  onChange={(e) => {
                    const next = [...questions];
                    next[idx] = { ...q, allowFileUpload: e.target.checked };
                    setQuestions(next);
                  }}
                />
                Permitir archivo en la respuesta
                {q.type === "file_upload" ? " (obligatorio en este tipo)" : ""}
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
    </AppShell>
  );
}
