"use client";

import { useState } from "react";
import { ApiConnector, ApiConfiguration, ApiExecutionLog } from "@/lib/gfi-dummy-data";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { X, ExternalLink, Copy, Check, AlertCircle } from "lucide-react";

type TabType = "config" | "logs" | "performance";

interface ApiDetailPanelProps {
  api: ApiConnector | null;
  configuration: ApiConfiguration | undefined;
  executionLogs: ApiExecutionLog[];
  onClose: () => void;
  initialTab?: TabType;
}

export function ApiDetailPanel({
  api,
  configuration,
  executionLogs,
  onClose,
  initialTab,
}: ApiDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab ?? "config");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!api) return null;

  const maskSensitiveData = (value: string, type: "url" | "key") => {
    if (type === "url") {
      const url = new URL(value);
      return `${url.protocol}//${url.hostname}/****`;
    }
    return `${value.substring(0, 10)}...${value.substring(value.length - 6)}`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredLogs = executionLogs.filter((log) => log.apiId === api.id);
  const successfulLogs = filteredLogs.filter((log) => log.status === "SUCCESS");
  const successRate =
    filteredLogs.length > 0 ? (successfulLogs.length / filteredLogs.length) * 100 : 0;

  const avgLatency =
    filteredLogs.length > 0
      ? Math.round(
          filteredLogs.reduce((sum, log) => sum + log.performanceMetrics.avgLatencyMs, 0) /
            filteredLogs.length
        )
      : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ maxWidth: "900px" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-4 z-40 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{api.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {api.provider} • {api.type} • v{api.version}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-gray-200 overflow-x-auto sticky top-20 z-40 bg-white">
          {(["config", "logs", "performance"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab === "config" && "Configuration"}
              {tab === "logs" && "Execution Logs"}
              {tab === "performance" && "Performance"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Configuration Tab */}
          {activeTab === "config" && (
            <div className="space-y-6">
              {/* Endpoint */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  API Endpoint
                </label>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                  <code className="flex-1 text-sm text-gray-600 break-all">
                    {maskSensitiveData(api.endpoint, "url")}
                  </code>
                  <button
                    onClick={() => copyToClipboard(api.endpoint, "endpoint")}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {copiedKey === "endpoint" ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Authentication */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Auth Type
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{api.authentationType}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Data Format
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{api.dataFormat}</p>
                  </div>
                </div>
              </div>

              {/* Configuration Details */}
              {configuration && (
                <>
                  {/* Mapping Rules */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Field Mapping Rules
                    </label>
                    <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                      {Object.entries(configuration.mappingRules).map(([from, to]) => (
                        <div
                          key={from}
                          className="flex items-center justify-between text-sm border-b border-gray-200 pb-2 last:border-0"
                        >
                          <code className="text-gray-700">{from}</code>
                          <span className="text-gray-400">→</span>
                          <code className="text-gray-700">{to}</code>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transformations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Transformations
                    </label>
                    <div className="space-y-1 bg-gray-50 rounded-lg p-4">
                      {configuration.transformations.map((transform, idx) => (
                        <p key={idx} className="text-sm text-gray-700 font-mono">
                          {transform}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Retry & Rate Limit */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Max Retries
                      </label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {configuration.retryPolicy.maxRetries} attempts
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Rate Limit
                      </label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {configuration.rateLimit.requestsPerSecond} req/s
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Configuration History
                    </label>
                    <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
                      <p>
                        Last updated:{" "}
                        <span className="font-medium">
                          {new Date(configuration.lastUpdatedAt).toLocaleString()}
                        </span>
                      </p>
                      <p>
                        By: <span className="font-medium">{configuration.updatedBy}</span>
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="primary" size="sm">
                  Test Connection
                </Button>
                <Button variant="secondary" size="sm">
                  Save Changes
                </Button>
                <Button variant="tertiary" size="sm">
                  Reset to Default
                </Button>
              </div>
            </div>
          )}

          {/* Execution Logs Tab */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No execution logs found for this API.</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {log.status === "SUCCESS" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              ✓ Success
                            </span>
                          )}
                          {log.status === "PARTIAL_SUCCESS" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                              ⚠ Partial
                            </span>
                          )}
                          {log.status === "FAILED" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              ✕ Failed
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(log.executionStartedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          Processed {log.recordsProcessed} of {log.recordsReceived} records
                          {log.recordsFailed > 0 && ` (${log.recordsFailed} failed)`}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {log.dataSize}
                      </span>
                    </div>

                    {log.errorLog && (
                      <div className="mb-3 bg-red-50 border border-red-200 rounded p-2 flex gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700">{log.errorLog}</p>
                      </div>
                    )}

                    {log.warnings && log.warnings.length > 0 && (
                      <div className="mb-3 bg-amber-50 border border-amber-200 rounded p-2">
                        {log.warnings.map((warning, idx) => (
                          <p key={idx} className="text-xs text-amber-700">
                            ⚠ {warning}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-gray-600">
                      Latency: {log.performanceMetrics.avgLatencyMs}ms • Throughput:{" "}
                      {log.performanceMetrics.throughputRecordsPerSec.toFixed(1)} rec/s
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                  <div className="p-4">
                    <p className="text-xs text-green-700 font-medium mb-1">Success Rate</p>
                    <p className="text-3xl font-bold text-green-900">
                      {successRate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      {successfulLogs.length} of {filteredLogs.length}
                    </p>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                  <div className="p-4">
                    <p className="text-xs text-blue-700 font-medium mb-1">Avg Latency</p>
                    <p className="text-3xl font-bold text-blue-900">{avgLatency}ms</p>
                    <p className="text-xs text-blue-700 mt-1">Across all executions</p>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                  <div className="p-4">
                    <p className="text-xs text-purple-700 font-medium mb-1">Total Processed</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {filteredLogs.reduce((sum, log) => sum + log.recordsProcessed, 0)}
                    </p>
                    <p className="text-xs text-purple-700 mt-1">Records across all runs</p>
                  </div>
                </Card>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Executions</h3>
                <div className="space-y-2">
                  {filteredLogs.slice(0, 5).map((log, idx) => (
                    <div key={log.id} className="flex items-center gap-3">
                      <div className="w-16 text-xs text-gray-600 flex-shrink-0">
                        {new Date(log.executionStartedAt).toLocaleTimeString()}
                      </div>
                      <div className="flex-1 bg-gray-100 rounded h-8 flex items-center px-3">
                        <div className="text-xs font-medium text-gray-700">
                          {log.recordsProcessed} records
                        </div>
                      </div>
                      <div
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          log.status === "SUCCESS"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {log.status === "SUCCESS" ? "✓" : "⚠"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer (sticky) */}
        <div className="sticky bottom-0 z-40 border-t border-gray-200 px-6 py-4 bg-white flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
