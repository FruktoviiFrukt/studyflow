"use client";

import { useState } from "react";
import { AlertTriangle, Calculator, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { averageGrade, calculateOverall, calculateStage, createStage, createSubject, defaultFormula, gradeStatus, initialSubjects, isLowGrade, type GradeStage, type GradeSubject } from "@/lib/grades";

const inputClass = "h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const formatGrade = (value: number | null) => value === null ? "—" : value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });

export default function GradeCalculator() {
  const [subjects, setSubjects] = useState<GradeSubject[]>(initialSubjects);
  const [selectedId, setSelectedId] = useState(initialSubjects[0].id);
  const [newSubject, setNewSubject] = useState("");
  const subject = subjects.find(item => item.id === selectedId)!;
  const results = subject.stages.map(stage => ({ stage, ...calculateStage(stage) }));
  const completed = results.filter(result => result.value !== null);
  const average = averageGrade(results.map(result => result.value));
  const overall = calculateOverall(subjects);
  const atRisk = results.filter(result => result.value !== null && result.value < 5);
  const lowParts = subject.stages.flatMap(stage => stage.parts.filter(part => isLowGrade(part.grade)).map(part => `${stage.name || "Без названия"}: ${part.name || part.variable}`));
  const riskLabels = [...atRisk.map(result => result.stage.name || "Без названия"), ...lowParts];

  function updateSubject(change: Partial<GradeSubject>) {
    setSubjects(current => current.map(item => item.id === selectedId ? { ...item, ...change } : item));
  }
  function updateStage(id: string, change: Partial<GradeStage>) {
    updateSubject({ stages: subject.stages.map(stage => stage.id === id ? { ...stage, ...change } : stage) });
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Успеваемость</p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Калькулятор оценок</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">Выберите предмет, заполните оценки по подпунктам и настройте формулы аттестаций.</p>
      </div>

      <Card className="rounded-2xl border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-3"><Calculator aria-hidden="true" className="shrink-0 text-blue-600" /><h3 className="font-semibold text-gray-700">Средний балл по всем предметам</h3></div>
            <div aria-live="polite" aria-atomic="true" className="flex flex-wrap items-center gap-4">
              <p className="text-5xl font-bold tracking-tight">{formatGrade(overall.average)}<span className="ml-2 text-xl font-medium text-gray-400">/ 10</span></p>
              <Badge variant="secondary" className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">{gradeStatus(overall.average)}</Badge>
            </div>
          </div>
          <div className="max-w-sm text-sm leading-6 text-gray-500"><p className="font-medium text-gray-700">Учтено предметов: {overall.countedSubjects} из {subjects.length}</p><p>Каждый предмет имеет одинаковый вес. Предметы без рассчитанных этапов не учитываются. До заполнения всех оценок результат предварительный.</p></div>
        </div>
      </Card>

      <Card className="rounded-2xl border-gray-200 p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="min-w-0"><span className="mb-2 block text-sm font-semibold">Предмет</span>
            <select className={inputClass} value={selectedId} onChange={event => setSelectedId(event.target.value)}>{subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          </label>
          <form className="flex min-w-0 flex-wrap items-end gap-2" onSubmit={event => {
            event.preventDefault();
            if (!newSubject.trim()) return;
            const item = createSubject(crypto.randomUUID(), newSubject.trim());
            setSubjects(current => [...current, item]);
            setSelectedId(item.id);
            setNewSubject("");
          }}>
            <label className="min-w-0 flex-1"><span className="mb-2 block text-sm font-semibold">Новый предмет</span><input className={inputClass} placeholder="Название предмета" value={newSubject} maxLength={120} onChange={event => setNewSubject(event.target.value)} /></label>
            <Button type="submit" disabled={!newSubject.trim()} className="h-10 rounded-lg"><Plus aria-hidden="true" />Добавить</Button>
          </form>
        </div>
      </Card>

      <Card className="rounded-2xl border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-3"><Calculator aria-hidden="true" className="shrink-0 text-blue-600" /><h3 className="font-semibold text-gray-700">Средний балл по предмету</h3></div>
            <div aria-live="polite" aria-atomic="true" className="flex flex-wrap items-center gap-4">
              <p className="text-5xl font-bold tracking-tight">{formatGrade(average)}<span className="ml-2 text-xl font-medium text-gray-400">/ 10</span></p>
              <Badge variant="secondary" className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">{gradeStatus(average)}</Badge>
            </div>
          </div>
          <div className="max-w-sm text-sm leading-6 text-gray-500"><p className="font-medium text-gray-700">Рассчитано этапов: {completed.length} из {results.length}</p><p>Среднее результатов рассчитанных этапов. Пока заполнены не все этапы, результат предварительный.</p></div>
        </div>
      </Card>

      {riskLabels.length > 0 && <div role="alert" className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0"><p className="font-semibold">Возможна пересдача или недопуск к экзамену</p><p className="mt-1 break-words leading-6">Есть оценки ниже 5: {riskLabels.join(", ")}. Уточните условия пересдачи и допуска у преподавателя.</p></div>
      </div>}

      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">Аттестации и другие этапы</h3><Button className="rounded-xl" onClick={() => updateSubject({ stages: [...subject.stages, createStage(crypto.randomUUID(), "Новый этап")] })}><Plus aria-hidden="true" />Добавить этап</Button></div>
      {subject.stages.length === 0 && <Card className="rounded-2xl p-8 text-center text-sm text-gray-500">Добавьте аттестацию, экзамен или другой этап, чтобы начать расчёт.</Card>}
      {results.map(({ stage, value, error }) => (
        <Card key={stage.id} className="overflow-hidden rounded-2xl border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-end gap-4 border-b border-gray-100 bg-gray-50/50 p-5 sm:p-6">
            <label className="min-w-0 flex-1"><span className="mb-2 block text-xs font-medium text-gray-500">Название этапа</span><input className={inputClass} value={stage.name} placeholder="Например, экзамен" maxLength={120} onChange={event => updateStage(stage.id, { name: event.target.value })} /></label>
            <div aria-live="polite" className="flex h-10 items-center gap-2"><span className="text-sm text-gray-500">Результат:</span><Badge variant="secondary" className={value !== null && value < 5 ? "bg-amber-100 text-amber-900" : "bg-blue-50 text-blue-700"}>{formatGrade(value)}</Badge></div>
            <Button variant="ghost" size="icon" className="size-10 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`Удалить этап ${stage.name}`} onClick={() => updateSubject({ stages: subject.stages.filter(item => item.id !== stage.id) })}><Trash2 aria-hidden="true" /></Button>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <div className="space-y-3">
              {stage.parts.map(part => (
                <div key={part.id} className="grid grid-cols-[1fr_40px] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_120px_40px]">
                  <label className="col-span-2 min-w-0 sm:col-span-1"><span className="mb-2 block text-xs font-medium text-gray-500">Подпункт · <span className="font-mono text-blue-600">{part.variable}</span></span><input className={inputClass} value={part.name} maxLength={120} placeholder="Название подпункта" onChange={event => updateStage(stage.id, { parts: stage.parts.map(item => item.id === part.id ? { ...item, name: event.target.value } : item) })} /></label>
                  <label><span className="mb-2 block text-xs font-medium text-gray-500">Оценка (1–10)</span><input className={inputClass} type="text" inputMode="decimal" maxLength={12} placeholder="Не введена" value={part.grade} aria-label={`${stage.name}: ${part.name}, ${part.variable}, оценка`} aria-describedby={`${stage.id}-feedback`} onChange={event => updateStage(stage.id, { parts: stage.parts.map(item => item.id === part.id ? { ...item, grade: event.target.value } : item) })} /></label>
                  <Button variant="ghost" size="icon" className="size-10 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`Удалить подпункт ${part.name}, ${part.variable} из ${stage.name}`} onClick={() => updateStage(stage.id, { parts: stage.parts.filter(item => item.id !== part.id) })}><Trash2 aria-hidden="true" /></Button>
                  {isLowGrade(part.grade) && <p role="status" className="col-span-full rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">Оценка ниже 5 — возможна пересдача или недопуск к экзамену, даже если итог этапа выше 5.</p>}
                </div>
              ))}
              {stage.parts.length === 0 && <p className="text-sm text-gray-500">Добавьте подпункты, оценки которых войдут в расчёт.</p>}
            </div>
            <Button variant="ghost" className="text-blue-600" onClick={() => {
              // Preserve variable identities, including references to removed parts.
              const used = new Set([...stage.parts.map(part => part.variable), ...Array.from(stage.formula.matchAll(/g\d+/gi), match => match[0].toLowerCase())]);
              let next = 1;
              while (used.has(`g${next}`)) next++;
              const variable = `g${next}`;
              updateStage(stage.id, { parts: [...stage.parts, { id: crypto.randomUUID(), variable, name: "", grade: "" }] });
            }}><Plus aria-hidden="true" />Добавить подпункт</Button>

            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <label className="block"><span className="mb-2 block text-sm font-semibold">Формула расчёта</span><input className={`${inputClass} font-mono`} value={stage.formula} maxLength={500} placeholder={defaultFormula(stage.parts) || "Добавьте подпункты"} aria-label={`Формула: ${stage.name}`} aria-describedby={`${stage.id}-help ${stage.id}-feedback`} aria-invalid={Boolean(error)} onChange={event => updateStage(stage.id, { formula: event.target.value })} /></label>
              <p id={`${stage.id}-help`} className="text-xs leading-5 text-gray-500">Пустая формула — среднее всех подпунктов. Используйте g1, g2, знаки +, −, *, / и скобки. Например: (g1 + g2) / 2 или g1 * 0.4 + g2 * 0.6. Можно вводить десятичную запятую.</p>
              {stage.formula && <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => updateStage(stage.id, { formula: "" })}>Вернуть среднее подпунктов</Button>}
              <p id={`${stage.id}-feedback`} aria-live="polite" className={`text-sm ${error ? "text-red-600" : value !== null && value < 5 ? "font-medium text-amber-800" : "text-gray-500"}`}>
                {error || (value === null ? "Для расчёта заполните оценки подпунктов, используемых в формуле." : value < 5 ? "Результат ниже 5 — возможна пересдача или недопуск к экзамену." : `Результат: ${formatGrade(value)} · ${gradeStatus(value)}`)}
              </p>
            </div>
          </div>
        </Card>
      ))}
      <p className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs leading-5 text-gray-500">Это личный калькулятор. Названия предметов — примеры; оценки и формулы вводите вы. Изменения сохраняются только до ухода со страницы или перезагрузки. Предупреждения учитывают результат до округления; окончательные условия допуска определяет преподаватель.</p>
    </div>
  );
}
