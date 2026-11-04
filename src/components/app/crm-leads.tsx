import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { managementOptions } from "@/lib/management";
import { portalOptions } from "@/lib/portal";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Section, PageHeader, EmptyState, Confirm } from "./ui-bits";
import { ContactComposer, ContactHistory } from "./contact-composer";
import { useAction, check } from "./actions";
import { dateBR, todayISO } from "@/lib/format";
const leadStatuses = [
  ["novo", "Novo interessado"],
  ["primeiro_contato", "Primeiro contato realizado"],
  ["aguardando", "Aguardando resposta"],
  ["negociacao", "Em negociação"],
  ["matriculado", "Matrícula realizada"],
  ["nao_convertido", "Não convertido"],
];
const colTone: Record<string, { bar: string; pill: string }> = {
  novo: { bar: "bg-primary", pill: "bg-primary/15 text-primary ring-primary/40" },
  primeiro_contato: { bar: "bg-chart-2", pill: "bg-chart-2/15 text-chart-2 ring-chart-2/40" },
  aguardando: { bar: "bg-muted-foreground", pill: "bg-muted text-muted-foreground ring-border" },
  negociacao: { bar: "bg-warning", pill: "bg-warning/20 text-warning-foreground ring-warning/50" },
  matriculado: { bar: "bg-success", pill: "bg-success/15 text-success ring-success/40" },
  nao_convertido: {
    bar: "bg-destructive",
    pill: "bg-destructive/10 text-destructive ring-destructive/40",
  },
};
export function CRMLeads() {
  const { data: d } = useSuspenseQuery(managementOptions);
  const { data: p } = useSuspenseQuery(portalOptions);
  const [selected, setSelected] = useState<Tables<"crm_leads"> | null>(),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [over, setOver] = useState<string | null>(null);
  const action = useAction();
  const navigate = useNavigate();
  const move = (id: string, next: string) =>
    action.mutate(async () =>
      check(await supabase.from("crm_leads").update({ status: next }).eq("id", id)),
    );
  const remove = (id: string) =>
    action.mutate(async () => check(await supabase.from("crm_leads").delete().eq("id", id)));
  return (
    <div className="space-y-5">
      <PageHeader
        title="CRM de interessados"
        description="Arraste os cards entre as colunas ou use o seletor em cada card."
        actions={<Button onClick={() => setSelected(null)}>Cadastrar interessado</Button>}
      />
      {selected !== undefined && (
        <LeadForm
          key={selected?.id ?? "new"}
          lead={selected}
          onClose={() => setSelected(undefined)}
        />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Buscar nome, telefone ou e-mail">
          <Input value={q} onChange={(e) => setQ(e.target.value)} />
        </Field>
        <Field label="Status">
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos</option>
            {leadStatuses.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="scroll-thin -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4">
        {leadStatuses
          .filter(([v]) => !status || v === status)
          .map(([col, colLabel]) => {
            const items = d.leads.filter(
              (l) =>
                l.status === col &&
                `${l.name} ${l.phone} ${l.email}`.toLowerCase().includes(q.toLowerCase()),
            );
            const tone = colTone[col ?? "novo"] ?? colTone["novo"]!;
            return (
              <section
                key={col}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(col ?? null);
                }}
                onDragLeave={() => setOver((o) => (o === col ? null : o))}
                onDrop={(e) => {
                  setOver(null);
                  const id = e.dataTransfer.getData("text/plain");
                  const lead = d.leads.find((x) => x.id === id);
                  if (lead && lead.status !== col) move(lead.id, col ?? "novo");
                }}
                className={`relative flex w-[85vw] max-w-[320px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-muted/30 p-3 pt-4 backdrop-blur transition-all ${over === col ? "border-2 border-dashed border-primary bg-primary/5 shadow-lg" : ""}`}
              >
                <span className={`absolute inset-x-0 top-0 h-1 ${tone.bar}`} />
                <header className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-xs font-extrabold uppercase tracking-widest">{colLabel}</h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${tone.pill}`}
                  >
                    {items.length}
                  </span>
                </header>
                <div className="flex min-h-24 flex-col gap-3">
                  {items.map((l) => (
                    <article
                      key={l.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", l.id)}
                      className="cursor-grab rounded-xl border bg-card/90 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                            {l.name.trim().charAt(0).toUpperCase()}
                          </span>
                          <h3 className="truncate font-semibold">{l.name}</h3>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setSelected(l)}>
                            Editar
                          </Button>
                          {!l.converted_student_id && (
                            <Confirm
                              destructive
                              title="Excluir este interessado?"
                              description="O cadastro e o histórico de contatos dele serão removidos. Esta ação não pode ser desfeita."
                              confirmLabel="Excluir"
                              trigger={
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  aria-label={`Excluir ${l.name}`}
                                >
                                  Excluir
                                </Button>
                              }
                              onConfirm={() => remove(l.id)}
                            />
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {l.objective && (
                          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {l.objective}
                          </span>
                        )}
                        {l.source && (
                          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {l.source}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {[l.phone, l.email].filter(Boolean).join(" · ")}
                      </p>
                      <select
                        aria-label="Mover para"
                        className="mt-2 h-9 w-full rounded-md border bg-background px-2 text-xs font-semibold text-primary"
                        value={l.status}
                        onChange={(e) => move(l.id, e.target.value)}
                      >
                        {leadStatuses.map(([v, lb]) => (
                          <option key={v} value={v}>
                            {lb}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Primeiro contato: {dateBR(l.first_contact_on)} · Próximo:{" "}
                        {dateBR(l.next_contact_on)}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <ContactComposer
                          leadId={l.id}
                          name={l.name}
                          phone={l.phone}
                          type="comercial"
                          message={() =>
                            `Oi, ${l.name}! Tudo bem? Estou passando para saber se você ainda tem interesse em começar seus treinos comigo. Se quiser, podemos conversar sobre seus objetivos e encontrar uma forma de começar que faça sentido para sua rotina. 💪`
                          }
                          label="Gerar acompanhamento"
                        />
                        {l.status !== "matriculado" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await navigator.clipboard.writeText(
                                  `${window.location.origin}/auth?mode=signup&code=${encodeURIComponent(p.settings?.invite_code ?? "")}&email=${encodeURIComponent(l.email)}&name=${encodeURIComponent(l.name)}&phone=${encodeURIComponent(l.phone)}`,
                                );
                                toast.success("Convite copiado.");
                              }}
                            >
                              Copiar convite de cadastro
                            </Button>
                            <Button
                              size="sm"
                              disabled={action.isPending}
                              onClick={() =>
                                action.mutate(async () => {
                                  const sid = check(
                                    await supabase.rpc("convert_crm_lead", { _lead_id: l.id }),
                                  );
                                  navigate({
                                    to: "/admin/alunos/$studentId",
                                    params: { studentId: sid },
                                  });
                                })
                              }
                            >
                              Converter em aluno
                            </Button>
                          </>
                        )}
                      </div>
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-semibold">
                          Histórico de relacionamento
                        </summary>
                        <ContactHistory leadId={l.id} />
                      </details>
                    </article>
                  ))}
                  {!items.length && (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      Arraste um card para cá
                    </p>
                  )}
                </div>
              </section>
            );
          })}
      </div>
      {!d.leads.length && <EmptyState title="Nenhum interessado cadastrado" />}
    </div>
  );
}
function LeadForm({ lead, onClose }: { lead: Tables<"crm_leads"> | null; onClose: () => void }) {
  const [name, setName] = useState(lead?.name ?? ""),
    [email, setEmail] = useState(lead?.email ?? ""),
    [phone, setPhone] = useState(lead?.phone ?? ""),
    [objective, setObjective] = useState(lead?.objective ?? ""),
    [source, setSource] = useState(lead?.source ?? ""),
    [notes, setNotes] = useState(lead?.notes ?? ""),
    [status, setStatus] = useState(lead?.status ?? "novo"),
    [next, setNext] = useState(lead?.next_contact_on ?? ""),
    [first, setFirst] = useState(lead?.first_contact_on ?? todayISO());
  const action = useAction();
  return (
    <Section title={lead ? "Editar interessado" : "Novo interessado"}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          action.mutate(async () => {
            const body = {
              name,
              email,
              phone,
              objective,
              source,
              notes,
              status,
              next_contact_on: next || null,
              first_contact_on: first,
            };
            if (lead) check(await supabase.from("crm_leads").update(body).eq("id", lead.id));
            else check(await supabase.from("crm_leads").insert(body));
            onClose();
          });
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome">
            <Input
              required
              maxLength={150}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Telefone / WhatsApp">
            <Input maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Origem do contato">
            <Input maxLength={150} value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
          <Field label="Objetivo">
            <Input
              maxLength={500}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </Field>
          <Field label="Status">
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {leadStatuses.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Primeiro contato">
            <Input required type="date" value={first} onChange={(e) => setFirst(e.target.value)} />
          </Field>
          <Field label="Próximo contato">
            <Input type="date" value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
        </div>
        <Field label="Observações privadas">
          <Textarea maxLength={4000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="flex gap-2">
          <Button disabled={action.isPending}>
            {action.isPending ? "Salvando…" : "Salvar interessado"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Section>
  );
}
