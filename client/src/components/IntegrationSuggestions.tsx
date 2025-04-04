import React from 'react';

interface AppIdentification {
  appId: string;
  appName: string;
  confidence: number;
  detectionMethod: string;
}

interface IntegrationDetails {
  serviceName: string;
  integrationUrl: string;
  description: string;
}

interface IntegrationSuggestion {
  appId: string;
  appName: string;
  makeDotCom?: IntegrationDetails;
  zapier?: IntegrationDetails;
}

interface IntegrationData {
  identifiedApps: AppIdentification[];
  suggestions: IntegrationSuggestion[];
}

interface IntegrationSuggestionsProps {
  integrationData: IntegrationData | null;
}

const IntegrationSuggestions: React.FC<IntegrationSuggestionsProps> = ({ integrationData }) => {
  if (!integrationData || !integrationData.identifiedApps.length) {
    return null;
  }

  return (
    <div className="integration-suggestions bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="text-xl font-semibold mb-3 text-indigo-700">
        Integration Suggestions
      </h3>
      <div className="mb-4">
        <h4 className="text-md font-medium mb-2 text-gray-700">Identified Applications</h4>
        <div className="flex flex-wrap gap-2">
          {integrationData.identifiedApps.map((app) => (
            <div 
              key={app.appId} 
              className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
              title={`Confidence: ${app.confidence.toFixed(2)}, Method: ${app.detectionMethod}`}
            >
              {app.appName}
            </div>
          ))}
        </div>
      </div>

      {integrationData.suggestions.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-2 text-gray-700">Automation Alternatives</h4>
          <div className="space-y-3">
            {integrationData.suggestions.map((suggestion) => (
              <div key={suggestion.appId} className="border border-gray-200 rounded p-3">
                <h5 className="font-medium">{suggestion.appName}</h5>
                <div className="mt-2 space-y-2">
                  {suggestion.makeDotCom && (
                    <a 
                      href={suggestion.makeDotCom.integrationUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded mr-2">
                        Make.com
                      </span>
                      {suggestion.makeDotCom.description}
                    </a>
                  )}
                  {suggestion.zapier && (
                    <a 
                      href={suggestion.zapier.integrationUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-orange-600 hover:text-orange-800"
                    >
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded mr-2">
                        Zapier
                      </span>
                      {suggestion.zapier.description}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationSuggestions; 