import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FormDataContextType {
  registerFormData: (key: string, data: any) => void;
  getAllFormData: () => any;
}

const FormDataContext = createContext<FormDataContextType | undefined>(undefined);

export const useFormData = () => {
  const context = useContext(FormDataContext);
  if (!context) {
    // Return a no-op if context not available (for forms that don't use it)
    return {
      registerFormData: () => {},
      getAllFormData: () => ({})
    };
  }
  return context;
};

// Universal hook for forms to automatically register their data
// Usage: useAutoFormData({ amounts: rows }) or useAutoFormData({ tableRows: rows })
export const useAutoFormData = (data: any, key: string = 'formData') => {
  const { registerFormData } = useFormData();
  
  // Register data whenever it changes
  React.useEffect(() => {
    if (data) {
      registerFormData(key, data);
    }
  }, [data, key, registerFormData]);
};

export const FormDataProvider = ({ children }: { children: ReactNode }) => {
  const [formDataMap, setFormDataMap] = useState<Record<string, any>>({});

  const registerFormData = (key: string, data: any) => {
    setFormDataMap(prev => ({
      ...prev,
      [key]: data
    }));
  };

  const getAllFormData = () => {
    // Merge all registered form data
    const merged: any = {};
    Object.values(formDataMap).forEach(data => {
      if (data && typeof data === 'object') {
        Object.assign(merged, data);
      }
    });
    return merged;
  };

  return (
    <FormDataContext.Provider value={{ registerFormData, getAllFormData }}>
      {children}
    </FormDataContext.Provider>
  );
};

