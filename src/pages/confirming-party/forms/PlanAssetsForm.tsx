import { BaseConfirmationForm } from "./BaseConfirmationForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatNumberInput, parseIndianNumber } from "@/lib/utils";

const PlanAssetsForm = ({ confirmation }: { confirmation: any }) => {
  const [rows, setRows] = useState([{ account: "", amount: "", currency: "" }]);

  const addRow = () => {
    setRows([...rows, { account: "", amount: "", currency: "" }]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handleSubmit = (data: any) => {
    const submitData = {
      ...data,
      accounts: rows,
      area: confirmation.area
    };
    console.log("Submitting:", submitData);
    alert("Confirmation submitted successfully!");
  };

  return (
    <BaseConfirmationForm
      confirmation={confirmation}
      certificationText="We certify that the above particulars (read alongwith the attachments if any) are full and correct."
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Kindly confirm to us the following information in respect of Plan Assets as on {confirmation.periodEndDate || "[Period-end Date]"}.
        </p>

        <p className="text-sm text-muted-foreground">
          Kindly include a statement of account having the contributions made, benefits paid and interest accrued during the year.
        </p>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
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
                      value={row.account}
                      onChange={(e) => updateRow(index, "account", e.target.value)}
                      placeholder="Enter account"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={formatNumberInput(row.amount)}
                      onChange={(e) => {
                        const numericValue = parseIndianNumber(e.target.value);
                        updateRow(index, "amount", numericValue.toString());
                      }}
                      placeholder="Enter amount"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.currency}
                      onChange={(e) => updateRow(index, "currency", e.target.value)}
                      placeholder="Currency"
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
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
      </div>
    </BaseConfirmationForm>
  );
};

export default PlanAssetsForm;