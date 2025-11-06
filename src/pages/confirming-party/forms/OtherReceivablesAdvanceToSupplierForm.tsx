import { BaseConfirmationForm } from "./BaseConfirmationForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatIndianDate, formatNumberInput, parseIndianNumber } from "@/lib/utils";

const OtherReceivablesAdvanceToSupplierForm = ({ confirmation }: { confirmation: any }) => {
  const [rows, setRows] = useState([{ amount: "", currency: "" }]);

  const addRow = () => setRows([...rows, { amount: "", currency: "" }]);
  const removeRow = (index: number) => setRows(rows.filter((_, i) => i !== index));
  const updateRow = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handleSubmit = (data: any) => {
    console.log("Submitting:", { ...data, rows, area: confirmation.area });
    alert("Confirmation submitted successfully!");
  };

  return (
    <BaseConfirmationForm
      confirmation={confirmation}
      certificationText="We certify that the above particulars (read alongwith the attachments if any) are full and correct and do not exclude any other amount receivable from us of this nature."
      onSubmit={handleSubmit}
    >
      <p className="text-sm text-muted-foreground mb-4">
        Kindly confirm to us the following information in respect of amounts receivable from you in respect of Advances as on {confirmation.periodEndDate ? formatIndianDate(confirmation.periodEndDate) : "[Period-end Date]"}.
      </p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    type="text"
                    value={formatNumberInput(row.amount)}
                    onChange={(e) => {
                      const numericValue = parseIndianNumber(e.target.value);
                      updateRow(index, "amount", numericValue.toString());
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.currency}
                    onChange={(e) => updateRow(index, "currency", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  {rows.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRow(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="h-4 w-4 mr-2" />Add Row
      </Button>
    </BaseConfirmationForm>
  );
};

export default OtherReceivablesAdvanceToSupplierForm;
