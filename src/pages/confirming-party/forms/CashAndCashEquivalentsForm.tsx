import { BaseConfirmationForm } from "./BaseConfirmationForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatNumberInput, parseIndianNumber, formatDateInput, formatIndianDate, parseIndianDate, cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

const CashAndCashEquivalentsForm = ({ confirmation }: { confirmation: any }) => {
  const [currentAccounts, setCurrentAccounts] = useState([{ designation: "", currency: "", balance: "" }]);
  const [overdrawnAccounts, setOverdrawnAccounts] = useState([{ designation: "", currency: "", balance: "", security: "" }]);
  const [loanAccounts, setLoanAccounts] = useState([{ designation: "", currency: "", balance: "", overdue: "", security: "" }]);
  const [depositAccounts, setDepositAccounts] = useState([{ designation: "", currency: "", balance: "", interest: "", dueDate: "", charges: "" }]);
  const [investments, setInvestments] = useState([{ designation: "", investmentIn: "", value: "" }]);
  const [margins, setMargins] = useState([{ beneficiary: "", nature: "", term: "", currency: "", amount: "" }]);
  const [billsCollection1, setBillsCollection1] = useState([{ designation: "", currency: "", amount: "", dueDate: "" }]);
  const [billsCollection2, setBillsCollection2] = useState([{ drawee: "", currency: "", amount: "", dueDate: "" }]);
  const [lettersOfCredit, setLettersOfCredit] = useState([{ beneficiary: "", currency: "", amount: "", term: "" }]);
  const [guaranteesA, setGuaranteesA] = useState([{ beneficiary: "", currency: "", amount: "", term: "" }]);
  const [guaranteesB, setGuaranteesB] = useState([{ beneficiary: "", currency: "", amount: "", period: "", isGuarantee: "" }]);
  const [derivatives, setDerivatives] = useState([{ nature: "", contractNumber: "", dealDate: "", currency: "", notional: "", valuation: "" }]);
  const [interestAccrued, setInterestAccrued] = useState("");
  const [isWilfulDefaulter, setIsWilfulDefaulter] = useState("");
  const [wilfulDefaulterRemarks, setWilfulDefaulterRemarks] = useState("");

  const handleSubmit = (data: any) => {
    const submitData = {
      ...data,
      currentAccounts,
      overdrawnAccounts,
      loanAccounts,
      depositAccounts,
      investments,
      margins,
      billsCollection1,
      billsCollection2,
      lettersOfCredit,
      guaranteesA,
      guaranteesB,
      derivatives,
      interestAccrued,
      isWilfulDefaulter,
      wilfulDefaulterRemarks,
      area: confirmation.area
    };
    console.log("Submitting:", submitData);
    alert("Confirmation submitted successfully!");
  };

  const addRow = (setter: any, initialValue: any) => {
    setter((prev: any[]) => [...prev, { ...initialValue }]);
  };

  const removeRow = (setter: any, index: number) => {
    setter((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (setter: any, index: number, field: string, value: string) => {
    setter((prev: any[]) => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };
      return newRows;
    });
  };

  return (
    <BaseConfirmationForm
      confirmation={confirmation}
      certificationText="We certify that the above particulars (read alongwith the attachments if any) are full and correct and do not exclude any other financial relationship of the entity with us."
      onSubmit={handleSubmit}
      hideRemarks={true}
    >
      <p className="text-sm text-muted-foreground mb-6">
        Kindly confirm the below balances to us pertaining to the account balances of {confirmation.confirmationFor} as are held with you as on {confirmation.periodEndDate}:
      </p>

      <div className="space-y-8">
        {/* 1. Current Accounts */}
        <div className="space-y-2">
          <h4 className="font-semibold">1. Current Accounts</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Designation of Account</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Balance [Credit/(Debit)]</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentAccounts.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><Input value={row.designation} onChange={(e) => updateRow(setCurrentAccounts, index, "designation", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.currency} onChange={(e) => updateRow(setCurrentAccounts, index, "currency", e.target.value)} /></TableCell>
                    <TableCell>
                      <Input 
                        type="text"
                        value={formatNumberInput(row.balance)}
                        onChange={(e) => {
                          const numericValue = parseIndianNumber(e.target.value);
                          updateRow(setCurrentAccounts, index, "balance", numericValue.toString());
                        }}
                      />
                    </TableCell>
                    <TableCell>{currentAccounts.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeRow(setCurrentAccounts, index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => addRow(setCurrentAccounts, { designation: "", currency: "", balance: "" })}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>

        {/* 2. Overdrawn Current Accounts */}
        <div className="space-y-2">
          <h4 className="font-semibold">2. Overdrawn Current Accounts (Overdraft Accounts and Cash Credit Accounts)</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Designation of Account</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Balance (Debit)</TableHead>
                  <TableHead>Security Held*</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdrawnAccounts.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><Input value={row.designation} onChange={(e) => updateRow(setOverdrawnAccounts, index, "designation", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.currency} onChange={(e) => updateRow(setOverdrawnAccounts, index, "currency", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" value={row.balance} onChange={(e) => updateRow(setOverdrawnAccounts, index, "balance", e.target.value)} /></TableCell>
                    <TableCell><Textarea value={row.security} onChange={(e) => updateRow(setOverdrawnAccounts, index, "security", e.target.value)} className="min-h-[60px]" /></TableCell>
                    <TableCell>{overdrawnAccounts.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeRow(setOverdrawnAccounts, index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground italic">*Give brief description of the documents executed with you for the above facilities and in case of securities e.g. shares, bonds or Title Deeds, please list them in full.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => addRow(setOverdrawnAccounts, { designation: "", currency: "", balance: "", security: "" })}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>

        {/* 3. Loan Accounts */}
        <div className="space-y-2">
          <h4 className="font-semibold">3. Loan Accounts</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Designation of Account</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Balance (Debit)</TableHead>
                  <TableHead>Overdue amount, if any</TableHead>
                  <TableHead>Security Held*</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loanAccounts.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><Input value={row.designation} onChange={(e) => updateRow(setLoanAccounts, index, "designation", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.currency} onChange={(e) => updateRow(setLoanAccounts, index, "currency", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" value={row.balance} onChange={(e) => updateRow(setLoanAccounts, index, "balance", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" value={row.overdue} onChange={(e) => updateRow(setLoanAccounts, index, "overdue", e.target.value)} /></TableCell>
                    <TableCell><Textarea value={row.security} onChange={(e) => updateRow(setLoanAccounts, index, "security", e.target.value)} className="min-h-[60px]" /></TableCell>
                    <TableCell>{loanAccounts.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeRow(setLoanAccounts, index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground italic">*Give brief description of the documents executed with you for the above facilities and in case of securities e.g. shares, bonds or Title Deeds, please list them in full.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => addRow(setLoanAccounts, { designation: "", currency: "", balance: "", overdue: "", security: "" })}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>

        {/* 4. Fixed, Call and Short Deposit Accounts */}
        <div className="space-y-2">
          <h4 className="font-semibold">4. Fixed, Call and Short Deposit Accounts</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Designation of Account</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Balance (Credit)</TableHead>
                  <TableHead>Interest Accrued</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Particulars for charges/lien</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depositAccounts.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><Input value={row.designation} onChange={(e) => updateRow(setDepositAccounts, index, "designation", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.currency} onChange={(e) => updateRow(setDepositAccounts, index, "currency", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" value={row.balance} onChange={(e) => updateRow(setDepositAccounts, index, "balance", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" value={row.interest} onChange={(e) => updateRow(setDepositAccounts, index, "interest", e.target.value)} /></TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !row.dueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {row.dueDate ? (
                              formatIndianDate(parseIndianDate(row.dueDate) || new Date())
                            ) : (
                              <span>dd-mm-yyyy</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={row.dueDate ? parseIndianDate(row.dueDate) || undefined : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const formatted = formatIndianDate(date);
                                updateRow(setDepositAccounts, index, "dueDate", formatted);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell><Input value={row.charges} onChange={(e) => updateRow(setDepositAccounts, index, "charges", e.target.value)} /></TableCell>
                    <TableCell>{depositAccounts.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeRow(setDepositAccounts, index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => addRow(setDepositAccounts, { designation: "", currency: "", balance: "", interest: "", dueDate: "", charges: "" })}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>

        {/* 5. Investments */}
        <div className="space-y-2">
          <h4 className="font-semibold">5. Investments and other Documents of title held in Safe Custody</h4>
          <p className="text-xs text-muted-foreground italic">*In case of investments held in D-Mat form, please enclose a statement of holding along with this annexure.</p>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Designation of Account</TableHead>
                  <TableHead>Investment in*</TableHead>
                  <TableHead>Value or number of shares held</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><Input value={row.designation} onChange={(e) => updateRow(setInvestments, index, "designation", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.investmentIn} onChange={(e) => updateRow(setInvestments, index, "investmentIn", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" value={row.value} onChange={(e) => updateRow(setInvestments, index, "value", e.target.value)} /></TableCell>
                    <TableCell>{investments.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeRow(setInvestments, index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => addRow(setInvestments, { designation: "", investmentIn: "", value: "" })}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>

        {/* 6. Margin against Letters of Credit, Guarantees issued, etc. */}
        <div className="space-y-2">
          <h4 className="font-semibold">6. Margin against Letters of Credit, Guarantees issued, etc.</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Nature of instrument</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Margin Amount</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {margins.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><Input value={row.beneficiary} onChange={(e) => updateRow(setMargins, index, "beneficiary", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.nature} onChange={(e) => updateRow(setMargins, index, "nature", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.term} onChange={(e) => updateRow(setMargins, index, "term", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.currency} onChange={(e) => updateRow(setMargins, index, "currency", e.target.value)} /></TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={formatNumberInput(row.amount)}
                        onChange={(e) => {
                          const numericValue = parseIndianNumber(e.target.value);
                          updateRow(setMargins, index, "amount", numericValue.toString());
                        }}
                        placeholder="Enter amount"
                      />
                    </TableCell>
                    <TableCell>{margins.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeRow(setMargins, index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => addRow(setMargins, { beneficiary: "", nature: "", term: "", currency: "", amount: "" })}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>

        {/* 7. Bills for Collection (First Type) */}
        <div className="space-y-2">
          <h4 className="font-semibold">7. Bills for Collection</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Designation</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billsCollection1.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><Input value={row.designation} onChange={(e) => updateRow(setBillsCollection1, index, "designation", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.currency} onChange={(e) => updateRow(setBillsCollection1, index, "currency", e.target.value)} /></TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={formatNumberInput(row.amount)}
                        onChange={(e) => {
                          const numericValue = parseIndianNumber(e.target.value);
                          updateRow(setBillsCollection1, index, "amount", numericValue.toString());
                        }}
                        placeholder="Enter amount"
                      />
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !row.dueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {row.dueDate ? (
                              formatIndianDate(parseIndianDate(row.dueDate) || new Date())
                            ) : (
                              <span>dd-mm-yyyy</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={row.dueDate ? parseIndianDate(row.dueDate) || undefined : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const formatted = formatIndianDate(date);
                                updateRow(setBillsCollection1, index, "dueDate", formatted);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>{billsCollection1.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeRow(setBillsCollection1, index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => addRow(setBillsCollection1, { designation: "", currency: "", amount: "", dueDate: "" })}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>

        {/* 8. Bills for Collection (Second Type) */}
        <div className="space-y-2">
          <h4 className="font-semibold">8. Bills for Collection</h4>
          <p className="text-xs text-muted-foreground italic">(Including Trust Receipt facilities, import loans or export bills negotiated etc. with the list of documents obtained for the same)</p>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name of Drawee</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billsCollection2.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><Input value={row.drawee} onChange={(e) => updateRow(setBillsCollection2, index, "drawee", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.currency} onChange={(e) => updateRow(setBillsCollection2, index, "currency", e.target.value)} /></TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={formatNumberInput(row.amount)}
                        onChange={(e) => {
                          const numericValue = parseIndianNumber(e.target.value);
                          updateRow(setBillsCollection2, index, "amount", numericValue.toString());
                        }}
                        placeholder="Enter amount"
                      />
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !row.dueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {row.dueDate ? (
                              formatIndianDate(parseIndianDate(row.dueDate) || new Date())
                            ) : (
                              <span>dd-mm-yyyy</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={row.dueDate ? parseIndianDate(row.dueDate) || undefined : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const formatted = formatIndianDate(date);
                                updateRow(setBillsCollection2, index, "dueDate", formatted);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>{billsCollection2.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeRow(setBillsCollection2, index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => addRow(setBillsCollection2, { drawee: "", currency: "", amount: "", dueDate: "" })}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>

        {/* 9. Letters of Credit */}
        <div className="space-y-2">
          <h4 className="font-semibold">9. Letters of Credit</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Letters of credit open and outstanding list of documents for the same in favour of:</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Amount not utilised</TableHead>
                  <TableHead>Term and valid upto</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lettersOfCredit.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><Input value={row.beneficiary} onChange={(e) => updateRow(setLettersOfCredit, index, "beneficiary", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.currency} onChange={(e) => updateRow(setLettersOfCredit, index, "currency", e.target.value)} /></TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={formatNumberInput(row.amount)}
                        onChange={(e) => {
                          const numericValue = parseIndianNumber(e.target.value);
                          updateRow(setLettersOfCredit, index, "amount", numericValue.toString());
                        }}
                        placeholder="Enter amount"
                      />
                    </TableCell>
                    <TableCell><Input value={row.term} onChange={(e) => updateRow(setLettersOfCredit, index, "term", e.target.value)} /></TableCell>
                    <TableCell>{lettersOfCredit.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeRow(setLettersOfCredit, index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => addRow(setLettersOfCredit, { beneficiary: "", currency: "", amount: "", term: "" })}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>

        {/* 10. Guarantees */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">10. Guarantees</h4>
            
            {/* 10(a) Guarantees given on behalf of clients */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm">(a) Guarantees given on behalf of clients and list of documents obtained for the same in favour of:</h5>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>In favour of:</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Term and Date of Expiry</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guaranteesA.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell><Input value={row.beneficiary} onChange={(e) => updateRow(setGuaranteesA, index, "beneficiary", e.target.value)} /></TableCell>
                        <TableCell><Input value={row.currency} onChange={(e) => updateRow(setGuaranteesA, index, "currency", e.target.value)} /></TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={formatNumberInput(row.amount)}
                            onChange={(e) => {
                              const numericValue = parseIndianNumber(e.target.value);
                              updateRow(setGuaranteesA, index, "amount", numericValue.toString());
                            }}
                            placeholder="Enter amount"
                          />
                        </TableCell>
                        <TableCell><Input value={row.term} onChange={(e) => updateRow(setGuaranteesA, index, "term", e.target.value)} /></TableCell>
                        <TableCell>{guaranteesA.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeRow(setGuaranteesA, index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => addRow(setGuaranteesA, { beneficiary: "", currency: "", amount: "", term: "" })}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
            </div>

            {/* 10(b) Letter of support/awareness/comfort */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm">(b) Any letter of support/awareness/comfort/any other given by the Company to the Bank:</h5>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>In favour of:</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Whether in the nature of guarantee by the Company</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guaranteesB.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell><Input value={row.beneficiary} onChange={(e) => updateRow(setGuaranteesB, index, "beneficiary", e.target.value)} /></TableCell>
                        <TableCell><Input value={row.currency} onChange={(e) => updateRow(setGuaranteesB, index, "currency", e.target.value)} /></TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={formatNumberInput(row.amount)}
                            onChange={(e) => {
                              const numericValue = parseIndianNumber(e.target.value);
                              updateRow(setGuaranteesB, index, "amount", numericValue.toString());
                            }}
                            placeholder="Enter amount"
                          />
                        </TableCell>
                        <TableCell><Input value={row.period} onChange={(e) => updateRow(setGuaranteesB, index, "period", e.target.value)} /></TableCell>
                        <TableCell><Input value={row.isGuarantee} onChange={(e) => updateRow(setGuaranteesB, index, "isGuarantee", e.target.value)} /></TableCell>
                        <TableCell>{guaranteesB.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeRow(setGuaranteesB, index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => addRow(setGuaranteesB, { beneficiary: "", currency: "", amount: "", period: "", isGuarantee: "" })}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
            </div>
          </div>
        </div>

        {/* 11. Interest Accrued */}
        <div className="space-y-2">
          <h4 className="font-semibold">11. Interest Accrued</h4>
          <p className="text-sm text-muted-foreground mb-2">Please state the amount of interest accrued but not due and not debited by you and interest overdue, if any, stating separately for each account.</p>
          <Input type="number" value={interestAccrued} onChange={(e) => setInterestAccrued(e.target.value)} placeholder="Enter amount" />
        </div>

        {/* 12. Derivative Contracts */}
        <div className="space-y-2">
          <h4 className="font-semibold">12. Derivative Contracts</h4>
          <p className="text-sm text-muted-foreground mb-2">List of all outstanding derivative contracts such as forward exchange contracts, currency and interest rate options, swaps, etc. as on closing date.</p>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nature of Contract</TableHead>
                  <TableHead>Contract Number</TableHead>
                  <TableHead>Deal Date</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Notional Amount</TableHead>
                  <TableHead>Mark to Market Valuation</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {derivatives.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><Input value={row.nature} onChange={(e) => updateRow(setDerivatives, index, "nature", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.contractNumber} onChange={(e) => updateRow(setDerivatives, index, "contractNumber", e.target.value)} /></TableCell>
                    <TableCell>
                      <Input 
                        type="text"
                        value={formatDateInput(row.dealDate)}
                        onChange={(e) => {
                          updateRow(setDerivatives, index, "dealDate", e.target.value);
                        }}
                        placeholder="dd-mm-yyyy"
                        maxLength={10}
                      />
                    </TableCell>
                    <TableCell><Input value={row.currency} onChange={(e) => updateRow(setDerivatives, index, "currency", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.notional} onChange={(e) => updateRow(setDerivatives, index, "notional", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.valuation} onChange={(e) => updateRow(setDerivatives, index, "valuation", e.target.value)} /></TableCell>
                    <TableCell>{derivatives.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeRow(setDerivatives, index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => addRow(setDerivatives, { nature: "", contractNumber: "", dealDate: "", currency: "", notional: "", valuation: "" })}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>

        {/* 13. Wilful Defaulter */}
        <div className="space-y-2">
          <h4 className="font-semibold">13. Whether the Entity has been declared a "wilful defaulter" or any show cause notice issued to the company under the 'Master Circular on Wilful Defaulters' dated July 1, 2014, as amended, issued by the Reserve Bank of India?</h4>
          <Select value={isWilfulDefaulter} onValueChange={setIsWilfulDefaulter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </BaseConfirmationForm>
  );
};

export default CashAndCashEquivalentsForm;