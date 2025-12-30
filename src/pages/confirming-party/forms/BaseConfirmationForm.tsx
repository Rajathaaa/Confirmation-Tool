import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Save, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { formatIndianDate, formatIndianDateTime, formatIndianNumber, formatNumberInput, parseIndianNumber } from "@/lib/utils";
import { FormDataProvider, useFormData } from "./FormDataContext";

interface BaseConfirmationFormProps {
  confirmation: any;
  children?: React.ReactNode;
  certificationText?: string;
  onSubmit: (data: any) => void;
  hideRemarks?: boolean; // Add this prop
  getFormData?: () => any; // Callback to get form-specific data (amounts, accounts, etc.)
}

const BaseConfirmationFormInner = ({
  confirmation,
  children,
  certificationText = "We certify that the above particulars (read alongwith the attachments if any) are full and correct.",
  onSubmit,
  hideRemarks = false, // Add default value
  getFormData // Callback to get form-specific data
}: BaseConfirmationFormProps) => {
  const [formData, setFormData] = useState<any>({});
  const [remarks, setRemarks] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [isCertified, setIsCertified] = useState(false);
  const { getAllFormData } = useFormData();

  const handleSaveDraft = async () => {
    const draftData = {
      ...formData,
      remarks,
      organizationName,
      name,
      designation,
      isCertified,
      attachments: attachments.map(f => f.name),
      status: "draft"
    };
    
    // Call backend API to save draft
    try {
      const response = await fetch('http://localhost:3002/api/submit-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationId: confirmation.id,
          formData: {
            ...draftData,
            ...getAllFormData(), // Get all registered form data from context
            ...(getFormData ? getFormData() : {}) // Also merge explicit getFormData if provided
          },
          remarks: remarks,
          attachments: attachments.map(f => f.name),
          name: name,
          designation: designation,
          organizationName: organizationName,
          status: "draft"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save draft');
      }

      alert("Draft saved successfully!");
      // Refresh the page to update status
      window.location.reload();
    } catch (error: any) {
      console.error('Error saving draft:', error);
      alert(`Failed to save draft: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!isCertified) {
      alert("Please certify the confirmation before submitting.");
      return;
    }
    if (!name || !designation) {
      alert("Please fill in your name and designation.");
      return;
    }
    const submitData = {
      ...formData,
      remarks,
      organizationName,
      name,
      designation,
      isCertified,
      attachments: attachments.map(f => f.name),
      status: "submitted",
      submittedAt: new Date().toISOString()
    };
    
    // Call backend API to submit confirmation (Stage 6)
    try {
      const response = await fetch('http://localhost:3002/api/submit-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationId: confirmation.id,
          formData: {
            ...formData,
            ...getAllFormData(), // Get all registered form data from context
            ...(getFormData ? getFormData() : {}) // Also merge explicit getFormData if provided
          },
          remarks: remarks,
          attachments: attachments.map(f => f.name),
          name: name,
          designation: designation,
          organizationName: organizationName,
          status: "submitted"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit confirmation');
      }

      alert("Confirmation submitted successfully!");
      // Call the onSubmit callback for any additional handling
      onSubmit(submitData);
      
      // Navigate back to confirmations list
      window.location.href = "/confirming-party/confirmations";
    } catch (error: any) {
      console.error('Error submitting confirmation:', error);
      alert(`Failed to submit confirmation: ${error.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirmation Response</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Letter Header */}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Dear {confirmation.auditorName},
          </p>
          {children}
        </div>

        {/* Remarks - Conditionally render */}
        {!hideRemarks && (
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea
              placeholder="Enter any remarks or additional information..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {/* Attachments */}
        <div className="space-y-2">
          <Label>Attachments</Label>
          <div className="flex flex-col gap-2">
            <Input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
            {attachments.length > 0 && (
              <div className="space-y-1">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                    <Upload className="h-4 w-4" />
                    <span className="flex-1">{file.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Certification */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-start gap-2">
            <Checkbox
              id="certification"
              checked={isCertified}
              onCheckedChange={(checked) => setIsCertified(checked as boolean)}
            />
            <Label htmlFor="certification" className="text-sm font-normal cursor-pointer whitespace-pre-line">
              {certificationText}
            </Label>
          </div>

          {/* Organization Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Organization Name (if any)</Label>
              <Input
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Organization name"
              />
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Designation *</Label>
              <Input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Your designation"
                required
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end border-t pt-4">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button onClick={handleSubmit} disabled={!isCertified || !name || !designation}>
            <Send className="h-4 w-4 mr-2" />
            Send to Auditor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Wrap with FormDataProvider to enable automatic form data collection
export const BaseConfirmationForm = (props: BaseConfirmationFormProps) => {
  return (
    <FormDataProvider>
      <BaseConfirmationFormInner {...props} />
    </FormDataProvider>
  );
};

