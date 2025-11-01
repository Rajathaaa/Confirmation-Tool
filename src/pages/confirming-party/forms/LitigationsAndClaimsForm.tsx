import { BaseConfirmationForm } from "./BaseConfirmationForm";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const LitigationsAndClaimsForm = ({ confirmation }: { confirmation: any }) => {
  const handleSubmit = (data: any) => {
    console.log("Submitting:", data);
    alert("Confirmation submitted successfully!");
  };

  return (
    <BaseConfirmationForm
      confirmation={confirmation}
      certificationText="We certify that the above particulars (read alongwith the attachments if any) are full and correct and do not exclude any other legal relationship of the entity with us."
      onSubmit={handleSubmit}
    >
      <p className="text-sm text-muted-foreground mb-4">
        Kindly furnish a list that describes and evaluates pending or threatened litigations, claims, and assessments with respect to which you have been engaged and to which you have devoted substantive attention on behalf of {confirmation.confirmationFor} in the form of legal consultation or representation. Your response should include matters that existed as at {confirmation.periodEndDate} as well as new matters during the period from that date to the specified effective date of your response.
      </p>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>The list of matters should include details of:</Label>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>A description of the nature of each matter,</li>
            <li>The progress of each matter to date,</li>
            <li>How the entity has responded or intends to respond (for example, to contest the case vigorously or to seek an out-of-court settlement), and</li>
            <li>An evaluation of the likelihood of an unfavourable outcome and an estimate, if one can be made of the amount of range of potential loss.</li>
          </ul>
        </div>
        
        <div className="space-y-2">
          <Label>Please respond and furnish such explanation, if any, as you consider necessary to supplement the foregoing information, including an explanation of those matters as to which your views may differ from those stated by the entity.</Label>
          <Textarea placeholder="Enter details..." rows={8} />
        </div>
      </div>
    </BaseConfirmationForm>
  );
};

export default LitigationsAndClaimsForm;
