'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { CaseStatus } from '@splexa-group/shared/enums';
import { usePageTitle } from '@/components/layout/top-bar-context';
import { useCreateCase } from '@/hooks/use-cases';
import { useClientSearch } from '@/hooks/use-clients';
import { Field } from '@/components/ui/input';
import { SelectGroup } from '@/components/ui/select';
import { TextareaField } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PageFooter } from '@/components/ui/page-footer';
import {
  CASE_STAGE_OPTIONS,
  CASE_TYPE_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  COURT_TYPE_OPTIONS,
  PARTY_ROLE_OPTIONS,
  PRIORITY_OPTIONS,
} from '@/lib/options';
import type { CreateCaseInput } from '@/types/cases';
import { toISODatetime } from '@/lib/utils';

type NewClientMode = 'search' | 'new';

export default function NewCasePage() {
  usePageTitle({ title: 'Cases', resourceTitle: 'New Case' });
  const router = useRouter();
  const createCase = useCreateCase();

  const [clientMode, setClientMode] = useState<NewClientMode>('search');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const { data: searchResults } = useClientSearch(clientSearch);
  const clients = searchResults?.data ?? [];

  const {
    register,
    control,
    handleSubmit,
    watch,
  } = useForm<CreateCaseInput>({
    defaultValues: { status: CaseStatus.Active },
    mode: 'onChange',
  });

  const title = watch('title');
  const newClientName = watch('newClient.fullName');
  const newClientPhone = watch('newClient.phone');

  const canSubmit =
    !!title?.trim() &&
    (
      (clientMode === 'search' && !!selectedClientId) ||
      (clientMode === 'new' && !!newClientName?.trim() && !!newClientPhone?.trim())
    );

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function onSubmit(data: CreateCaseInput) {
    const payload: CreateCaseInput = {
      ...data,
      ...(clientMode === 'search'
        ? { clientId: selectedClientId! }
        : { newClient: data.newClient }),
    };
    if (clientMode === 'search') {
      payload.newClient = undefined;
    } else {
      payload.clientId = undefined;
    }
    const result = await createCase.mutateAsync({
      ...payload,
      filingDate: toISODatetime(payload.filingDate),
    });
    router.push(`/cases/${result.id}?tab=case`);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto bg-page">
        <div className="max-w-2xl mx-auto p-6 space-y-4">

          {/* Required section */}
          <div className="bg-card border border-line rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-line">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-placeholder">
                Required
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <Field
                label="Case Title"
                placeholder="e.g. Sharma v State of AP"
                required
                {...register('title', { required: true })}
              />

              {/* Client selection */}
              <div>
                <label className="text-sm font-medium text-label block mb-2">
                  Client <span className="text-negative">*</span>
                </label>

                {clientMode === 'search' && (
                  <div className="space-y-2">
                    {selectedClientId ? (
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-md border border-brand bg-brand-soft">
                        <span className="text-sm font-medium text-brand">{selectedClientName}</span>
                        <button
                          type="button"
                          onClick={() => { setSelectedClientId(null); setSelectedClientName(''); }}
                          className="text-xs text-brand hover:underline"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Search by name or phone…"
                          className="w-full h-9 px-3 rounded-md border border-line bg-card text-sm text-dark placeholder:text-placeholder focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                        {clients.length > 0 && clientSearch.length >= 2 && (
                          <div className="absolute top-10 left-0 right-0 z-20 bg-card border border-line rounded-lg shadow-md max-h-48 overflow-y-auto">
                            {clients.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setSelectedClientId(c.id);
                                  setSelectedClientName(c.fullName);
                                  setClientSearch('');
                                }}
                                className="w-full text-left px-3 py-2.5 text-sm hover:bg-subtle border-b border-line last:border-b-0"
                              >
                                <span className="font-medium text-dark">{c.fullName}</span>
                                <span className="text-secondary ml-2 text-xs">{c.phone}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {!selectedClientId && (
                      <button
                        type="button"
                        onClick={() => setClientMode('new')}
                        className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                      >
                        <Plus className="size-3" /> Create new client instead
                      </button>
                    )}
                  </div>
                )}

                {clientMode === 'new' && (
                  <div className="space-y-3 p-3 border border-line rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-secondary">New client</span>
                      <button
                        type="button"
                        onClick={() => setClientMode('search')}
                        className="text-xs text-brand hover:underline"
                      >
                        Search existing instead
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Field
                          label="Full Name"
                          required
                          {...register('newClient.fullName', { required: clientMode === 'new' })}
                        />
                      </div>
                      <Field
                        label="Phone"
                        required
                        {...register('newClient.phone', { required: clientMode === 'new' })}
                      />
                      <Controller
                        name="newClient.type"
                        control={control}
                        defaultValue="Individual"
                        render={({ field }) => (
                          <SelectGroup
                            label="Client Type"
                            options={CLIENT_TYPE_OPTIONS}
                            value={field.value ?? 'Individual'}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Client role */}
              <Controller
                name="clientRole"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <SelectGroup
                    label="Client Role"
                    options={PARTY_ROLE_OPTIONS}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Select role"
                    required
                  />
                )}
              />
            </div>
          </div>

          {/* Optional: Case Details */}
          <CollapsibleSection
            title="Case Details"
            expanded={expandedSections['case'] ?? false}
            onToggle={() => toggleSection('case')}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              <Field label="Case Number" {...register('caseNumber')} />
              <Controller
                name="caseType"
                control={control}
                render={({ field }) => (
                  <SelectGroup
                    label="Case Type"
                    options={CASE_TYPE_OPTIONS}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Select type"
                  />
                )}
              />
              <Field label="Filing Date" type="date" {...register('filingDate')} />
              <Controller
                name="stage"
                control={control}
                render={({ field }) => (
                  <SelectGroup
                    label="Stage"
                    options={CASE_STAGE_OPTIONS}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Select stage"
                  />
                )}
              />
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <SelectGroup
                    label="Priority"
                    options={PRIORITY_OPTIONS}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Select priority"
                  />
                )}
              />
              <div className="md:col-span-3">
                <TextareaField label="Description" rows={3} {...register('description')} />
              </div>
            </div>
          </CollapsibleSection>

          {/* Optional: Court Details */}
          <CollapsibleSection
            title="Court Details"
            expanded={expandedSections['court'] ?? false}
            onToggle={() => toggleSection('court')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div className="md:col-span-2">
                <Field label="Court Name" {...register('courtName')} />
              </div>
              <Controller
                name="courtType"
                control={control}
                render={({ field }) => (
                  <SelectGroup
                    label="Court Type"
                    options={COURT_TYPE_OPTIONS}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Select type"
                  />
                )}
              />
              <Field label="Bench No." {...register('benchNumber')} />
              <Field label="State" {...register('courtState')} />
              <Field label="City" {...register('courtCity')} />
            </div>
          </CollapsibleSection>

          {/* Optional: Judge Details */}
          <CollapsibleSection
            title="Judge Details"
            expanded={expandedSections['judge'] ?? false}
            onToggle={() => toggleSection('judge')}
          >
            <div className="grid grid-cols-2 gap-4 p-4">
              <Field label="Judge Name" {...register('judgeName')} />
              <Field label="Designation" {...register('judgeDesignation')} />
            </div>
          </CollapsibleSection>

        </div>
      </div>

      <PageFooter
        right={
          <>
            <Button variant="secondary" size="sm" onClick={() => router.push('/cases')}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!canSubmit}
              loading={createCase.isPending}
              onClick={handleSubmit(onSubmit)}
            >
              Create Case
            </Button>
          </>
        }
      />
    </div>
  );
}

function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-line hover:bg-subtle transition-colors"
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-placeholder">
          {title}
          <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-placeholder/70">
            (optional)
          </span>
        </span>
        {expanded ? (
          <ChevronUp className="size-4 text-placeholder" />
        ) : (
          <ChevronDown className="size-4 text-placeholder" />
        )}
      </button>
      {expanded && children}
    </div>
  );
}
