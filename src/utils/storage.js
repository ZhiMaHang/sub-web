/**
 * 获取本地存储项
 * @param {string} itemKey - 存储键
 * @returns {string} 存储值
 */
export const getLocalStorageItem = (itemKey) => {
  try {
    const now = +new Date();
    const ls = localStorage.getItem(itemKey);

    if (ls !== null) {
      const data = JSON.parse(ls);
      if (data && typeof data.value === 'string' && data.expire > now) {
        return data.value;
      }

      localStorage.removeItem(itemKey);
    }
  } catch {
    removeLocalStorageItem(itemKey);
  }

  return '';
};

/**
 * 设置本地存储项
 * @param {string} itemKey - 存储键
 * @param {string} itemValue - 存储值
 * @param {number} ttl - 生存时间（秒）
 */
export const setLocalStorageItem = (itemKey, itemValue, ttl) => {
  try {
    const now = +new Date();

    const data = {
      setTime: now,
      ttl: parseInt(ttl),
      expire: now + ttl * 1000,
      value: itemValue
    };
    localStorage.setItem(itemKey, JSON.stringify(data));
  } catch {
    // 本地存储不可用时不影响订阅转换功能
  }
};

/**
 * 删除本地存储项
 * @param {string} itemKey - 存储键
 */
export const removeLocalStorageItem = (itemKey) => {
  try {
    localStorage.removeItem(itemKey);
  } catch {
    // 本地存储不可用时无需继续处理
  }
};
