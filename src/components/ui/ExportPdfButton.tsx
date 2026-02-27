"use client"

import { Download } from "lucide-react"

export function ExportPdfButton() {
    return (
        <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-[#004f32] text-white rounded-lg hover:bg-[#003622] transition-colors shadow-sm font-medium text-sm print:hidden group"
            title="Download PDF Report"
        >
            <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            Export PDF
        </button>
    )
}
