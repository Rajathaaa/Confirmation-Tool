import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, FileText, Trash2, Download } from "lucide-react";
import { useState } from "react";

interface SampleSet {
  id: string;
  name: string;
  fileName: string;
  samplingMethod: "random" | "mus";
  sampleSize: number;
  populationSize: number;
  status: "pending" | "generated";
}

const AUDIT_AREAS = [
  "Trade Receivables",
  "Trade Payables",
  "Cash & Cash Equivalents",
  "Inventory",
  "Fixed Assets",
  "Investments",
  "Loans & Advances",
  "Other Current Assets",
];

export const SampleGeneration = () => {
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["Trade Receivables"]);
  const [activeArea, setActiveArea] = useState("Trade Receivables");
  const [sampleSets, setSampleSets] = useState<Record<string, SampleSet[]>>({
    "Trade Receivables": [
      {
        id: "SS-001",
        name: "Q4 Receivables Sample",
        fileName: "receivables_data.xlsx",
        samplingMethod: "mus",
        sampleSize: 45,
        populationSize: 1250,
        status: "generated"
      }
    ]
  });

  const [newSetName, setNewSetName] = useState("");
  const [showNewSetForm, setShowNewSetForm] = useState(false);

  const addArea = (area: string) => {
    if (!selectedAreas.includes(area)) {
      setSelectedAreas([...selectedAreas, area]);
      setSampleSets({ ...sampleSets, [area]: [] });
    }
  };

  const addSampleSet = () => {
    if (newSetName && activeArea) {
      const newSet: SampleSet = {
        id: `SS-${Date.now()}`,
        name: newSetName,
        fileName: "",
        samplingMethod: "random",
        sampleSize: 0,
        populationSize: 0,
        status: "pending"
      };
      setSampleSets({
        ...sampleSets,
        [activeArea]: [...(sampleSets[activeArea] || []), newSet]
      });
      setNewSetName("");
      setShowNewSetForm(false);
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Left Panel - Areas */}
      <div className="w-64 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Audit Areas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedAreas.map((area) => (
              <Button
                key={area}
                variant={activeArea === area ? "default" : "outline"}
                className="w-full justify-start text-sm"
                onClick={() => setActiveArea(area)}
              >
                {area}
              </Button>
            ))}
            <Select onValueChange={addArea}>
              <SelectTrigger>
                <SelectValue placeholder="Add Area" />
              </SelectTrigger>
              <SelectContent>
                {AUDIT_AREAS.filter(area => !selectedAreas.includes(area)).map((area) => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Sample Sets */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{activeArea}</h2>
            <p className="text-muted-foreground text-sm">Manage sample sets for this area</p>
          </div>
          <Button onClick={() => setShowNewSetForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Sample Set
          </Button>
        </div>

        {showNewSetForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Sample Set</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Sample Set Name</Label>
                <Input
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  placeholder="e.g., Q4 Trade Receivables"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addSampleSet}>Create</Button>
                <Button variant="outline" onClick={() => setShowNewSetForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sample Sets List */}
        <div className="space-y-4">
          {(sampleSets[activeArea] || []).map((set) => (
            <Card key={set.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{set.name}</CardTitle>
                    <CardDescription>Sample Set ID: {set.id}</CardDescription>
                  </div>
                  <Badge variant={set.status === "generated" ? "default" : "secondary"}>
                    {set.status === "generated" ? "Generated" : "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Upload Data File</Label>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        {set.fileName || "Choose File"}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Sampling Method</Label>
                    <Select defaultValue={set.samplingMethod}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="random">Random Sampling</SelectItem>
                        <SelectItem value="mus">Monetary Unit Sampling (MUS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {set.status === "generated" && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-muted-foreground">Population Size</Label>
                      <p className="text-lg font-semibold">{set.populationSize}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Sample Size</Label>
                      <p className="text-lg font-semibold">{set.sampleSize}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Sampling %</Label>
                      <p className="text-lg font-semibold">
                        {((set.sampleSize / set.populationSize) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {set.status === "pending" ? (
                    <Button className="w-full">Generate Samples</Button>
                  ) : (
                    <>
                      <Button className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Download Sample
                      </Button>
                      <Button className="flex-1">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Authorization Letter
                      </Button>
                      <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!sampleSets[activeArea] || sampleSets[activeArea].length === 0) && !showNewSetForm && (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Sample Sets</h3>
            <p className="text-muted-foreground mb-4">Create a sample set to get started</p>
            <Button onClick={() => setShowNewSetForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Sample Set
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};
