"use client";
import React, { useState, useEffect } from 'react';
import TrendForecastChart from '../components/charts/TrendForecastChart';
import { useTickets } from '@/lib/contexts/TicketContext';
import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

const TrendsContent: React.FC = () => {
  const { uniqueAgents, uniqueGroups } = useTickets();
  const [scope, setScope] = useState<'agent' | 'team'>('agent');
  const [names, setNames] = useState<string[]>([]);
  const [granularity, setGranularity] = useState<'weekly' | 'monthly'>('monthly');
  const [forecastPeriods, setForecastPeriods] = useState<number>(3);
  const [method, setMethod] = useState<'linear' | 'exponential'>('linear');

  // Initialize default entity when scope or lists change
  useEffect(() => {
    if (scope === 'agent' && uniqueAgents.length > 0) {
      setNames((prev) => prev.length ? prev.filter(n => uniqueAgents.includes(n)) : [uniqueAgents[0]]);
    }
    if (scope === 'team' && uniqueGroups.length > 0) {
      setNames((prev) => prev.length ? prev.filter(n => uniqueGroups.includes(n)) : [uniqueGroups[0]]);
    }
  }, [scope, uniqueAgents, uniqueGroups]);

  return (
    <div className="w-full p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Scope selector (modern) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scope</label>
          <Listbox value={scope} onChange={setScope}>
            <div className="relative mt-1">
              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <span className="block truncate">{scope === 'agent' ? 'Agent' : 'Team'}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  <Listbox.Option value="agent" className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>Agent</Listbox.Option>
                  <Listbox.Option value="team" className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>Team</Listbox.Option>
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>

        {/* Entity selector with modern multi-select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {scope === 'agent' ? 'Agent(s)' : 'Team(s)'}
          </label>
          <Listbox value={names} onChange={setNames} multiple>
            <div className="relative mt-1">
              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <span className="block truncate">
                  {names.length === 0
                    ? `Select ${scope === 'agent' ? 'agent(s)' : 'team(s)'}`
                    : names.join(', ')}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {(scope === 'agent' ? uniqueAgents : uniqueGroups).map((item) => (
                    <Listbox.Option
                      key={item}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                        }`
                      }
                      value={item}
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'} 
                            ${scope === 'team' && item === 'IT Team' ? 'font-bold text-blue-600 dark:text-blue-400' : ''} 
                            ${scope === 'team' && item === 'Coreshack' ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}`}
                          >
                            {item}
                            {scope === 'team' && item === 'IT Team' && (
                              <span className="ml-1 text-xs font-normal text-blue-400 dark:text-blue-300">(all IT groups combined)</span>
                            )}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>

        {/* Granularity selector (modern) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Granularity</label>
          <Listbox value={granularity} onChange={setGranularity}>
            <div className="relative mt-1">
              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <span className="block truncate">{granularity.charAt(0).toUpperCase() + granularity.slice(1)}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  <Listbox.Option value="weekly" className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>Weekly</Listbox.Option>
                  <Listbox.Option value="monthly" className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>Monthly</Listbox.Option>
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>

        {/* Forecast Periods (modern) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forecast Periods</label>
          <input
            type="number"
            min={1}
            value={forecastPeriods}
            onChange={(e) => setForecastPeriods(Math.max(1, parseInt(e.target.value) || 1))}
            className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Forecast method (modern) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method</label>
          <Listbox value={method} onChange={setMethod}>
            <div className="relative mt-1">
              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <span className="block truncate">{method === 'linear' ? 'Linear Regression' : 'Exponential Smoothing'}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  <Listbox.Option value="linear" className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>Linear Regression</Listbox.Option>
                  <Listbox.Option value="exponential" className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>Exponential Smoothing</Listbox.Option>
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-[500px]">
        {names.length > 0 && (
          <TrendForecastChart
            scope={scope}
            names={names}
            granularity={granularity}
            forecastPeriods={forecastPeriods}
            method={method}
          />
        )}
      </div>
    </div>
  );
};

export default TrendsContent; 