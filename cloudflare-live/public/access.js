export const accountRoles={superadmin:'Superadmin',admin:'Admin',user:'User'};
export const canEdit=user=>['superadmin','admin'].includes(user?.role);
export const canManageAccounts=user=>user?.role==='superadmin';
export function allowedAdminTab(user,tab){return tab==='accounts'?canManageAccounts(user):canEdit(user)||['overview','statistics','maintenance'].includes(tab)}
