import { useEffect, useState } from 'react';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import {
  getDocumentAssetPreview,
  getDocumentBranding,
  getApiErrorMessage,
  removeDocumentAsset,
  updateDocumentBranding,
  uploadDocumentAsset,
  type DocumentAsset,
  type DocumentAssetType,
  type DocumentBranding,
} from '../lib/api';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const DocumentBrandingSettings = () => {
  const [settings, setSettings] = useState<DocumentBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAsset, setBusyAsset] = useState<DocumentAssetType | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshSettings = async () => {
    const result = await getDocumentBranding();
    setSettings(result);
  };

  useEffect(() => {
    let active = true;
    getDocumentBranding()
      .then((result) => { if (active) setSettings(result); })
      .catch(() => { if (active) setError('Could not load document branding settings. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleUpload = async (assetType: DocumentAssetType, file?: File) => {
    if (!file) return;
    setError('');
    setNotice('');
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('Each image must be 2 MB or smaller.');
      return;
    }
    setBusyAsset(assetType);
    try {
      await uploadDocumentAsset(assetType, file);
      await refreshSettings();
      setNotice(`${assetType === 'CLINIC_SEAL' ? 'Clinic seal' : 'Authorized billing signature'} uploaded.`);
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, 'Could not upload this image.'));
    } finally {
      setBusyAsset(null);
    }
  };

  const handleRemove = async (assetType: DocumentAssetType) => {
    if (!window.confirm(`Remove this ${assetType === 'CLINIC_SEAL' ? 'clinic seal' : 'billing signature'}?`)) return;
    setError('');
    setNotice('');
    setBusyAsset(assetType);
    try {
      await removeDocumentAsset(assetType);
      await refreshSettings();
      setNotice('Document image removed. Existing invoices are unchanged.');
    } catch (removeError) {
      setError(getApiErrorMessage(removeError, 'Could not remove this image.'));
    } finally {
      setBusyAsset(null);
    }
  };

  const handleSavePreferences = async () => {
    if (!settings) return;
    setError('');
    setNotice('');
    setSaving(true);
    try {
      setSettings(await updateDocumentBranding(
        settings.includeSealOnInvoice,
        settings.includeSignatureOnInvoice,
      ));
      setNotice('Invoice branding preferences saved. They apply to newly issued invoices.');
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Could not save invoice branding preferences.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 rounded-lg bg-white p-6 text-sm text-gray-600"><Loader2 className="h-4 w-4 animate-spin" />Loading document branding…</div>;
  }

  if (!settings) {
    return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'Document branding settings are unavailable.'}</div>;
  }

  return (
    <section className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Invoices &amp; receipts</p>
        <h2 className="mt-1 text-2xl font-bold text-gray-900">Document Branding</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Upload your clinic seal and authorized billing signature once. They are added to invoices issued after you enable them.
          Previously issued invoices keep their original PDF.
        </p>
      </header>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      <div className="grid gap-4 xl:grid-cols-2">
        <AssetCard
          title="Clinic Seal / Stamp"
          description="PNG or JPEG. Transparent PNG is recommended."
          assetType="CLINIC_SEAL"
          asset={settings.clinicSeal}
          uploading={busyAsset === 'CLINIC_SEAL'}
          onUpload={(file) => void handleUpload('CLINIC_SEAL', file)}
          onRemove={() => void handleRemove('CLINIC_SEAL')}
        />
        <AssetCard
          title="Authorized Billing Signature"
          description="For billing documents only. This is a visual signature image, not a legally recognized digital signature."
          assetType="BILLING_SIGNATURE"
          asset={settings.billingSignature}
          uploading={busyAsset === 'BILLING_SIGNATURE'}
          onUpload={(file) => void handleUpload('BILLING_SIGNATURE', file)}
          onRemove={() => void handleRemove('BILLING_SIGNATURE')}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <h3 className="font-semibold text-gray-900">Include on newly issued invoices</h3>
        <div className="mt-3 space-y-3">
          <label className="flex min-h-11 items-center gap-3 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={settings.includeSealOnInvoice}
              disabled={!settings.clinicSeal || saving}
              onChange={(event) => setSettings({ ...settings, includeSealOnInvoice: event.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Include clinic seal
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={settings.includeSignatureOnInvoice}
              disabled={!settings.billingSignature || saving}
              onChange={(event) => setSettings({ ...settings, includeSignatureOnInvoice: event.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Include authorized billing signature
          </label>
        </div>
        <button
          type="button"
          onClick={() => void handleSavePreferences()}
          disabled={saving}
          className="mt-4 min-h-11 w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </div>

      <p className="text-xs leading-5 text-gray-500">
        Each image is limited to 2 MB. Assets and finalized PDFs are stored in the clinic database; database backups and storage usage include these files.
        Current asset removal or replacement does not change previously issued invoices.
      </p>
    </section>
  );
};

interface AssetCardProps {
  title: string;
  description: string;
  assetType: DocumentAssetType;
  asset: DocumentAsset | null;
  uploading: boolean;
  onUpload: (file?: File) => void;
  onRemove: () => void;
}

const AssetCard = ({ title, description, assetType, asset, uploading, onUpload, onRemove }: AssetCardProps) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setPreviewUrl('');
    setPreviewError('');
    if (!asset) return () => { active = false; };
    getDocumentAssetPreview(assetType)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setPreviewUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => { if (active) setPreviewError('Image preview could not be loaded.'); });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [asset?.id, asset?.checksumSha256, assetType]);

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm leading-5 text-gray-600">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex min-h-28 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
        {asset && previewUrl ? (
          <img src={previewUrl} alt={`${title} preview`} className="max-h-28 max-w-full object-contain" />
        ) : asset && previewError ? (
          <p role="alert" className="text-sm text-red-700">{previewError}</p>
        ) : asset ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" aria-label="Loading image preview" />
        ) : (
          <p className="text-sm text-gray-500">No image uploaded</p>
        )}
      </div>
      {asset && <p className="mt-2 break-all text-xs text-gray-500">{asset.originalFilename} · {(asset.fileSize / 1024).toFixed(0)} KB</p>}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className={`inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {asset ? 'Replace' : 'Upload'}
          <input
            type="file"
            accept="image/png,image/jpeg,.png,.jpg,.jpeg"
            disabled={uploading}
            className="sr-only"
            onChange={(event) => {
              onUpload(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>
        {asset && (
          <button
            type="button"
            onClick={onRemove}
            disabled={uploading}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Remove
          </button>
        )}
      </div>
    </article>
  );
};

export default DocumentBrandingSettings;
