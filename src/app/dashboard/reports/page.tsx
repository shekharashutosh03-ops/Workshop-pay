// @ts-nocheck
'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, FileSpreadsheet, Table as TableIcon } from 'lucide-react';
import { toast } from 'sonner';

const reportTypes = [
  { id: 'revenue', label: 'Revenue Report', icon: FileText, desc: 'Complete revenue breakdown by program, month, and payment mode' },
  { id: 'participants', label: 'Participant Report', icon: FileText, desc: 'All participant details with attendance and payment status' },
  { id: 'payments', label: 'Payment Report', icon: FileSpreadsheet, desc: 'Transaction history with amounts, modes, and statuses' },
  { id: 'programs', label: 'Program Report', icon: TableIcon, desc: 'Program performance metrics and statistics' },
  { id: 'employees', label: 'Employee Report', icon: FileText, desc: 'Employee details with program assignments' },
];

export default function ReportsPage() {
  const [format, setFormat] = useState('pdf');

  const generateReport = async (reportId: string) => {
    toast.success(`Generating ${reportId} report as ${format.toUpperCase()}...`);
    // In production, this would call an API endpoint that generates the actual report
    setTimeout(() => {
      toast.success('Report generated! Download will start shortly.');
    }, 2000);
  };

  return (
    <>
      <TopBar title="Reports" subtitle="Generate and export reports" />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="border-0 shadow-sm stat-card group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl gradient-primary"><Icon className="w-5 h-5 text-white" /></div>
                  </div>
                  <CardTitle className="text-base mt-3">{report.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{report.desc}</p>
                  <Button variant="outline" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" onClick={() => generateReport(report.id)}>
                    <Download className="w-4 h-4" />
                    Generate {format.toUpperCase()}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
