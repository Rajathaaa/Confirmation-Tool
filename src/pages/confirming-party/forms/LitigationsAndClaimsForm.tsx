import { BaseConfirmationForm } from "./BaseConfirmationForm";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { formatIndianDate } from "@/lib/utils";

const LitigationsAndClaimsForm = ({ confirmation }: { confirmation: any }) => {
  const [mattersDetails, setMattersDetails] = useState("");
  const [limitations, setLimitations] = useState("");

  const handleSubmit = (data: any) => {
    const submitData = {
      ...data,
      mattersDetails,
      limitations,
      area: confirmation.area
    };
    console.log("Submitting:", submitData);
    alert("Confirmation submitted successfully!");
  };

  return (
    <BaseConfirmationForm
      confirmation={confirmation}
      certificationText="We certify that the above particulars (read alongwith the attachments if any) are full and correct and do not exclude any other legal relationship of the entity with us."
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground mb-6">
          Kindly confirm the below balances to us pertaining to the account balances of {confirmation.confirmationFor} as are held with you as on {confirmation.periodEndDate ? formatIndianDate(confirmation.periodEndDate) : "[Period-end Date]"}:
        </p>

        <p className="text-sm text-muted-foreground">
          Kindly also furnish a list of unasserted claims or assessments (considered by management to be probable of assertion and which, if asserted, would have at least a reasonable possibility of an unfavourable outcome).
        </p>

        <div className="space-y-3">
          <Label className="text-sm font-semibold">The list of matters should include details of:</Label>
          <ol className="text-sm text-muted-foreground space-y-2 ml-6 list-decimal">
            <li>A description of the nature of each matter,</li>
            <li>The progress of each matter to date,</li>
            <li>How the entity has responded or intends to respond (for example, to contest the case vigorously or to seek an out-of-court settlement), and</li>
            <li>An evaluation of the likelihood of an unfavourable outcome and an estimate, if one can be made of the amount of range of potential loss.</li>
          </ol>
        </div>

        <div className="space-y-2">
          <Label>Please respond and furnish such explanation, if any, as you consider necessary to supplement the foregoing information, including an explanation of those matters as to which your views may differ from those stated by the entity.</Label>
          <Textarea
            placeholder="Enter details of matters and explanations..."
            value={mattersDetails}
            onChange={(e) => setMattersDetails(e.target.value)}
            rows={10}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Please identify the nature of, and reasons for, any limitation on your response.</Label>
          <Textarea
            placeholder="Enter any limitations on your response, if applicable..."
            value={limitations}
            onChange={(e) => setLimitations(e.target.value)}
            rows={4}
            className="w-full"
          />
        </div>
      </div>
    </BaseConfirmationForm>
  );
};

export default LitigationsAndClaimsForm;
