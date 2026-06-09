"use client";

import React, { useState } from "react";
import { apiConnectors, apiExecutionLogs, apiConfigurations, ApiConnector } from "@/lib/gfi-dummy-data";
import { ApiRegistryGrid } from "./components/ApiRegistryGrid";
import { ApiDetailPanel } from "./components/ApiDetailPanel";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Server,
  AlertCircle,
  CheckCircle2,
  Activity,
  RefreshCw,
  Settings,
} from "lucide-react";

export default function IntegrationPage() {
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  type TabType = "config" | "logs" | "performance";
  const [selectedInitialTab, setSelectedInitialTab] = useState<TabType | undefined>(undefined);

  const selectedApi = selectedApiId
    ? apiConnectors.find((api) => api.id === selectedApiId) || null
    : null;

  const selectedConfig = selectedApiId
    ? apiConfigurations.find((config) => config.apiId === selectedApiId)
    : undefined;

  const handleSelectApi = (api: ApiConnector, initialTab?: TabType) => {
    setSelectedApiId(api.id);
    setSelectedInitialTab(initialTab);
    setIsDetailPanelOpen(true);
  };

  // Calculate dashboard metrics
  const activeApis = apiConnectors.filter((api) => api.status === "ACTIVE").length;
  const totalApis = apiConnectors.length;
  const avgHealthScore = Math.round(
    apiConnectors.reduce((sum, api) => sum + api.healthScore, 0) / totalApis
  );

  const allLogs = apiExecutionLogs;
  const errorLogs = allLogs.filter((log) => log.status === "FAILED");
  const warningLogs = allLogs.filter((log) => log.status === "PARTIAL_SUCCESS");
  const recentSync = allLogs.length > 0 ? allLogs[0].executionStartedAt : "Never";

  const formatTimeAgo = (isoDate: string) => {
    const now = new Date();
    const then = new Date(isoDate);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Management & Integrations</h1>
          <p className="text-gray-600 mt-1">
            Monitor connected APIs, manage configurations, and view real-time execution logs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
          <Button variant="primary">
            <Settings className="w-4 h-4 mr-2" />
            Add API
          </Button>
        </div>
      </div>

      {/* Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total APIs */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total APIs</p>
              <p className="text-3xl font-bold text-gray-900">{totalApis}</p>
            </div>
            <Server className="w-8 h-8 text-brand-primary opacity-20" />
          </div>
        </Card>

        {/* Active Status */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-green-600">{activeApis}</p>
                <p className="text-sm text-gray-500">of {totalApis}</p>
              </div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500 opacity-20" />
          </div>
        </Card>

        {/* Health Score */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Health</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-gray-900">{avgHealthScore}%</p>
                <div className="text-xs text-gray-500">
                  {avgHealthScore >= 90 ? "✓ Good" : avgHealthScore >= 75 ? "⚠ Fair" : "✕ Poor"}
                </div>
              </div>
            </div>
            <Activity className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
        </Card>

        {/* Last Sync */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Last Sync</p>
              <p className="text-lg font-bold text-gray-900">{formatTimeAgo(recentSync)}</p>
              {errorLogs.length > 0 || warningLogs.length > 0 ? (
                <p className="text-xs text-amber-600 mt-1">
                  {errorLogs.length + warningLogs.length} warnings
                </p>
              ) : (
                <p className="text-xs text-green-600 mt-1">All clear</p>
              )}
            </div>
            {errorLogs.length > 0 ? (
              <AlertCircle className="w-8 h-8 text-red-500 opacity-20" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-20" />
            )}
          </div>
        </Card>
      </div>

      {/* Alerts/Warnings */}
      {(errorLogs.length > 0 || warningLogs.length > 0) && (
        <Card className="border-l-4 border-amber-500 bg-amber-50">
          <div className="flex gap-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">Integration Alerts</h3>
              <ul className="space-y-1 text-sm text-amber-800">
                {errorLogs.slice(0, 2).map((log) => (
                  <li key={log.id}>
                    • {apiConnectors.find((a) => a.id === log.apiId)?.name} execution failed:{" "}
                    {log.errorLog}
                  </li>
                ))}
                {warningLogs.slice(0, 2).map((log) => (
                  <li key={log.id}>
                    • {apiConnectors.find((a) => a.id === log.apiId)?.name} reported warnings:{" "}
                    {log.warnings?.[0]}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* API Registry Grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Connected APIs</h2>
          <p className="text-sm text-gray-600 mt-1">
            Click any API to view detailed configuration and execution history.
          </p>
        </div>
        <ApiRegistryGrid
          apis={apiConnectors}
          onSelectApi={handleSelectApi}
          selectedApiId={selectedApiId || undefined}
        />
      </div>

      {/* API Detail Panel Modal */}
      {isDetailPanelOpen && selectedApi && (
        <ApiDetailPanel
          api={selectedApi}
          configuration={selectedConfig}
          executionLogs={apiExecutionLogs}
          initialTab={selectedInitialTab}
          onClose={() => {
            setIsDetailPanelOpen(false);
            setSelectedApiId(null);
            setSelectedInitialTab(undefined);
          }}
        />
      )}

      {/* Recent Activity */}
      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Execution Activity</h3>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {apiExecutionLogs.slice(0, 8).map((log) => {
            const api = apiConnectors.find((a) => a.id === log.apiId);
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0"
              >
                <div className="mt-1">
                  {log.status === "SUCCESS" && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {log.status === "PARTIAL_SUCCESS" && (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  {log.status === "FAILED" && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{api?.name}</p>
                  <p className="text-xs text-gray-600">
                    {new Date(log.executionStartedAt).toLocaleString()} • Processed{" "}
                    {log.recordsProcessed} records • {log.dataSize}
                  </p>
                  {log.errorLog && (
                    <p className="text-xs text-red-600 mt-1">Error: {log.errorLog}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatTimeAgo(log.executionStartedAt)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
