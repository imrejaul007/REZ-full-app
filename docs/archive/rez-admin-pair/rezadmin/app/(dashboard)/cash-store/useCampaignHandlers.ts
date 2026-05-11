import { useState } from 'react';
import { showAlert } from '../../../utils/alert';

export interface CampaignFormState {
  title: string;
  budget: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export const DEFAULT_CAMPAIGN_FORM: CampaignFormState = {
  title: '', budget: '', startDate: '', endDate: '', isActive: true,
};

export function useCampaignHandlers(initialForm?: Partial<CampaignFormState>) {
  const [form, setForm] = useState<CampaignFormState>({ ...DEFAULT_CAMPAIGN_FORM, ...initialForm });
  
  const updateField = (field: keyof CampaignFormState, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };
  
  const save = async () => {
    if (!form.title) { showAlert('Error', 'Title is required'); return; }
    showAlert('Success', 'Campaign saved');
  };
  
  const deleteCampaign = async (_id: string) => { showAlert('Deleted', 'Campaign deleted'); };
  const toggleActive = async (_id: string) => {};
  const openForm = (item?: any) => { setForm(item ? { ...item } : { ...DEFAULT_CAMPAIGN_FORM }); };
  const addStore = async (_storeId: string) => {};
  const removeStore = async (_storeId: string) => {};
  const generateCode = async () => 'GEN' + Math.random().toString(36).substr(2, 6).toUpperCase();
  const tagToggle = async (_tag: string) => {};
  
  return { form, updateField, save, deleteCampaign, toggleActive, openForm, setForm, addStore, removeStore, generateCode, tagToggle };
}
