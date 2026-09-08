"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import NotesInput from "./notes-input";
import SubjectSelect from "./subject-select";
import GenerationSettings from "./generation-settings";
import GenerateButton from "./generate-button";
import {
  getGenerationReadiness,
  type Difficulty,
  type QuestionType,
} from "@/lib/ai-coach";

export default function AiCoach() {
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [noteText, setNoteText] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null,
  );
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionType, setQuestionType] = useState<QuestionType>("single");

  const hasNotes = noteFile !== null || noteText.trim().length > 0;
  const hasSubject = selectedSubjectId !== null;
  const { canGenerate, hint } = getGenerationReadiness({
    hasSubject,
    hasNotes,
  });

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          Подготовка к экзамену
        </p>
        <div className="flex items-center gap-2">
          <Sparkles aria-hidden="true" className="size-6 text-blue-600" />
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            AI Exam Coach
          </h2>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
          Загрузите конспекты или вставьте текст лекции — AI Exam Coach
          сгенерирует вопросы для самопроверки по выбранному предмету, с нужным
          количеством, уровнем сложности и типом вопросов. Так вы быстро
          увидите, что уже усвоено, а что стоит повторить перед экзаменом.
        </p>
      </div>

      <NotesInput
        file={noteFile}
        onFileChange={setNoteFile}
        text={noteText}
        onTextChange={setNoteText}
      />

      <SubjectSelect
        selectedSubjectId={selectedSubjectId}
        onSelect={setSelectedSubjectId}
      />

      <GenerationSettings
        questionCount={questionCount}
        onQuestionCountChange={setQuestionCount}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        questionType={questionType}
        onQuestionTypeChange={setQuestionType}
      />

      <GenerateButton canGenerate={canGenerate} hint={hint} />
    </div>
  );
}
