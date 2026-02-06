// . 手机号脱敏
function maskPhoneNumber(phoneNumber) {
  if (!phoneNumber) return "";
  return phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
}
//  身份证号脱敏
function maskIdCard(idCard) {
  if (!idCard) return "";
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, "$1****$2");
}
// 银行卡号脱敏
function maskBankCard(bankCard) {
  if (!bankCard) return "";
  return bankCard.replace(/(\d{4})\d{8}(\d{4})/, "$1 **** **** $2");
}
//  用户名脱敏
function maskUsername(username) {
  if (!username) return '';
  const length = username.length;
  
  // 对于两位字符的用户名，将第二个字符替换为 '*'
  if (length === 2) {
    return username.charAt(0) + '*';
  }
  
  // 对于单个字符的用户名，不脱敏
  if (length <= 1) return username;
  
  // 对于其他长度的用户名，脱敏中间部分
  return username.slice(0, 1) + '*'.repeat(length - 2) + username.slice(-1);
}

export function maskSensitiveData(data, type = "phone") {
  switch (type) {
    case "phone":
      return maskPhoneNumber(data);
    case "idCard":
      return maskIdCard(data);
    case "bankCard":
      return maskBankCard(data);
    case "username":
      return maskUsername(data);
    default:
      return data; // 如果没有匹配到，直接返回原始数据
  }
}
