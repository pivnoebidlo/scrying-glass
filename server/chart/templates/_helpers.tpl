{{- define "sgrepo.name" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "sgrepo.labels" -}}
app.kubernetes.io/name: scrying-glass-repo
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end -}}

{{- define "sgrepo.selector" -}}
app.kubernetes.io/name: scrying-glass-repo
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "sgrepo.secret" -}}
{{- .Values.existingSecret | default (include "sgrepo.name" .) -}}
{{- end -}}
