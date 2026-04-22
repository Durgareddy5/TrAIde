import api from './api';

const kotakAdminService = {
  getSessionStatus: () => api.get('/kotak/session'),
  loginWithTotp: (totp, refreshInstrumentMaster = true) =>
    api.post('/kotak/login', { totp, refreshInstrumentMaster }),
  autoLogin: () => api.post('/kotak/auto-login'),
  refreshInstrumentMaster: () => api.post('/kotak/instrument-master/refresh'),
  getInstrumentMasterStatus: () => api.get('/kotak/instrument-master/status'),
  logout: () => api.post('/kotak/logout'),
};

export default kotakAdminService;
