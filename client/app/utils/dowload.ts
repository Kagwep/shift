// Download functions
export const downloadJSON = (result:any) => {
  if (!result?.data) return;
  
  const dataStr = JSON.stringify(result.data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rebalance-result-${new Date().toISOString()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadZIP = (result:any) => {
  if (!result?.zip) return;
  
  const blob = new Blob([result.zip], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rebalance-results-${new Date().toISOString()}.zip`;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadReport = (result:any,zipFiles:any) => {
  if (!zipFiles['rebalance-report.txt']) return;
  
  const blob = new Blob([zipFiles['rebalance-report.txt']], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rebalance-report-${new Date().toISOString()}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};