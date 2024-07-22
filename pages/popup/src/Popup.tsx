import '@src/Popup.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useEffect, useState } from 'react';

const Popup = () => {
  // Forms
  const [inputs, setInputs] = useState([]);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs: any) => {
        if (tabs && tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, { _af__from: 'popup', _af__subject: 'initForm' }, e => {
            setInputs(e.data);
            e.data.forEach((input: any) => {
              if (input && input.defaultValue) {
                setFormData(prevState => ({
                  ...prevState,
                  [input.name]: input.defaultValue,
                }));
              }
            });
          });
        }
      },
    );
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      files: ['content-runtime/index.iife.js'],
    });
    await chrome.tabs.sendMessage(tab.id!, { data: formData, _af__from: 'popup', _af__subject: 'contentScript' });
  };

  return (
    <div className={`App p-4 bg-white`}>
      <header className={`App-header relative pb-16 text-base text-gray-900`}>
        <div className="space-y-4 text-left">
          {inputs &&
            inputs.map((input: any) => (
              <div key={input.name} className="flex flex-col">
                <label className="mb-2" htmlFor={input.name}>
                  {input.label}
                </label>

                {input.type === 'select' && (
                  <select
                    className="border px-4 py-2 rounded-md border-gray-200"
                    id={input.name}
                    name={input.name}
                    value={(formData as any)[input.name as any] || ''}
                    onChange={handleChange}>
                    {input.options &&
                      input.options.length > 0 &&
                      input.options.map((option: any) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                )}

                {input.type !== 'select' && (
                  <input
                    className="border px-4 py-2 rounded-md border-gray-200"
                    type={input.type}
                    id={input.name}
                    placeholder={input.label || input.name}
                    name={input.name}
                    value={(formData as any)[input.name as any] || ''}
                    onChange={handleChange}
                  />
                )}
              </div>
            ))}
        </div>

        <div className="fixed bottom-0 flex justify-center w-full bg-white left-0 px-4 py-2 border-t">
          <button
            className="font-semibold w-full block cursor-pointer bg-blue-600 rounded-md px-4 py-2 text-white"
            onClick={handleSubmit}>
            Save
          </button>
        </div>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
