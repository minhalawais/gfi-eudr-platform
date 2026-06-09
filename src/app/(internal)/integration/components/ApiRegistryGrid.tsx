"use client";

import { useState } from "react";
import { ApiConnector } from "@/lib/gfi-dummy-data";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import {
  Activity,
  Settings,
  PlayCircle,
  PauseCircle,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

type TabType = "config" | "logs" | "performance";

interface ApiRegistryGridProps {
  apis: ApiConnector[];
  onSelectApi: (api: ApiConnector, initialTab?: TabType) => void;
  selectedApiId?: string;
}

export function ApiRegistryGrid({
  apis,
  onSelectApi,
  selectedApiId,
}: ApiRegistryGridProps) {
  const getHealthColor = (score: number) => {
    if (score >= 95) return "text-green-500";
    if (score >= 80) return "text-amber-500";
    return "text-red-500";
  };

  const getStatusIcon = (status: ApiConnector["status"]) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "TESTING":
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case "PAUSED":
        return <PauseCircle className="w-5 h-5 text-gray-400" />;
      case "ERROR":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const formatTimeAgo = (isoDate: string) => {
    const now = new Date();
    const then = new Date(isoDate);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {apis.map((api) => (
        <Card
          key={api.id}
          className={`cursor-pointer transition-all hover:shadow-lg ${
            selectedApiId === api.id
              ? "ring-2 ring-brand-primary shadow-lg"
              : "hover:shadow-md"
          }`}
          onClick={() => onSelectApi(api)}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(api.status)}
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                  {api.name}
                </h3>
              </div>
              <p className="text-xs text-gray-500">{api.provider}</p>
            </div>
            <StatusBadge
              status={api.status.toLowerCase() as any}
            />
          </div>

          {/* Health Score */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Health</label>
              <span className={`text-sm font-bold ${getHealthColor(api.healthScore)}`}>
                {api.healthScore}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  api.healthScore >= 95
                    ? "bg-green-500"
                    : api.healthScore >= 80
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${api.healthScore}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-600 mb-1">Processed</p>
              <p className="font-semibold text-gray-900">{api.recordsProcessed}</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-600 mb-1">Errors</p>
              <p className={`font-semibold ${api.errorCount > 0 ? "text-red-600" : "text-green-600"}`}>
                {api.errorCount}
              </p>
            </div>
          </div>

          {/* Last Sync & Next Sync */}
          <div className="space-y-2 mb-4 text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Last: {formatTimeAgo(api.lastSyncAt)}</span>
            </div>
            {api.nextSyncAt && (
              <div className="flex items-center gap-2 text-gray-600">
                <Zap className="w-3.5 h-3.5 text-brand-primary" />
                <span>Next: {formatTimeAgo(api.nextSyncAt)}</span>
              </div>
            )}
          </div>

          {/* Sync Frequency Badge */}
          <div className="mb-4 inline-block">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              {api.syncFrequency === "REAL_TIME" && <Zap className="w-3 h-3 mr-1" />}
              {api.syncFrequency}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-100">
              <Button
                variant="tertiary"
                size="sm"
                className="flex-1 flex items-center justify-center gap-2 whitespace-nowrap"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectApi(api, "config");
                }}
              >
                <Settings className="w-4 h-4 inline-block align-middle" />
                <span className="align-middle leading-none">Config</span>
              </Button>
            <Button
              variant="tertiary"
              size="sm"
              className="flex-1 flex items-center justify-center gap-2 whitespace-nowrap"
              onClick={(e) => {
                e.stopPropagation();
                onSelectApi(api, "logs");
              }}
            >
              <Activity className="w-4 h-4 inline-block align-middle" />
              <span className="align-middle leading-none">Logs</span>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
