window.__ModuleLoader__.load({
  id: 'dsh-town-life',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;
    const API = '/town-life/settings';
    const plain = value => (value && typeof value === 'object' && typeof value.get === 'function') ? value.get() : value;
    const plainConfig = source => Object.fromEntries(Object.entries(source || {}).map(([key, value]) => [key, plain(value)]));
    const get = async () => {
      const response = await fetch(API, { headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    };
    const post = async body => {
      const response = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) throw new Error(result?.error || `HTTP ${response.status}`);
      return result;
    };
    const styles = `
[data-tl]{display:flex;flex-direction:column;gap:16px;padding:4px 0 24px;color:inherit}
[data-tl-row]{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
[data-tl-grow]{flex:1;min-width:200px}
[data-tl-title]{font-weight:600;font-size:14px}
[data-tl-note]{font-size:12px;opacity:.68;line-height:1.5}
[data-tl-panel]{display:flex;flex-direction:column;gap:10px;padding:12px;border:1px solid rgba(127,127,127,.2);border-radius:6px}
[data-tl-grid]{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
[data-tl-cell]{padding:8px 10px;border:1px solid rgba(127,127,127,.16);border-radius:6px;display:flex;flex-direction:column;gap:3px}
[data-tl-k]{font-size:11px;opacity:.62}
[data-tl-v]{font-size:14px;font-weight:600}
[data-tl-input]{width:170px;padding:6px 8px;border:1px solid rgba(127,127,127,.35);border-radius:5px;background:transparent;color:inherit}
[data-tl-btn]{padding:6px 12px;border:1px solid rgba(127,127,127,.35);border-radius:5px;background:transparent;color:inherit;cursor:pointer;text-decoration:none}
[data-tl-btn]:disabled{opacity:.5;cursor:default}
[data-tl-check]{width:16px;height:16px;margin-top:2px}
`;
    function TextSetting({ config, save, busy, field, label, note, wide }) {
      const [value, setValue] = React.useState(String(config[field] ?? ''));
      React.useEffect(() => setValue(String(config[field] ?? '')), [config[field]]);
      return h('label', { 'data-tl-row': '' },
        h('span', { 'data-tl-grow': '' }, h('span', { 'data-tl-title': '' }, label), note ? h('div', { 'data-tl-note': '' }, note) : null),
        h('input', {
          'data-tl-input': '', style: wide ? { width: 300 } : undefined, value, disabled: busy,
          onChange: e => setValue(e.target.value),
          onBlur: () => { if (value !== String(config[field] ?? '')) save({ [field]: value }); },
        }));
    }
    function NumberSetting({ config, save, busy, field, label, min, max, step = 1 }) {
      const [value, setValue] = React.useState(String(config[field] ?? min));
      React.useEffect(() => setValue(String(config[field] ?? min)), [config[field]]);
      return h('label', { 'data-tl-row': '' },
        h('span', { 'data-tl-grow': '' }, h('span', { 'data-tl-title': '' }, label)),
        h('input', {
          'data-tl-input': '', type: 'number', min, max, step, value, disabled: busy,
          onChange: e => setValue(e.target.value),
          onBlur: () => save({ [field]: Math.max(min, Math.min(max, Number(value) || min)) }),
        }));
    }
    function SelectSetting({ config, save, busy, field, label, options, note }) {
      return h('label', { 'data-tl-row': '' },
        h('span', { 'data-tl-grow': '' }, h('span', { 'data-tl-title': '' }, label), note ? h('div', { 'data-tl-note': '' }, note) : null),
        h('select', { 'data-tl-input': '', value: config[field], disabled: busy, onChange: e => save({ [field]: e.target.value }) },
          options.map(option => h('option', { key: option.value, value: option.value }, option.label))));
    }
    function CheckSetting({ config, save, busy, field, label, note }) {
      return h('label', { 'data-tl-row': '' },
        h('input', { 'data-tl-check': '', type: 'checkbox', checked: config[field] !== false, disabled: busy, onChange: e => save({ [field]: e.target.checked }) }),
        h('span', { 'data-tl-grow': '' }, h('span', { 'data-tl-title': '' }, label), note ? h('div', { 'data-tl-note': '' }, note) : null));
    }
    function Panel() {
      const [config, setConfig] = React.useState(null);
      const [state, setState] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const [message, setMessage] = React.useState('');
      const [error, setError] = React.useState('');
      const load = React.useCallback(async () => {
        try {
          const result = await get();
          setConfig(plainConfig(result.config));
          setState(result.state || null);
          setError('');
        } catch (e) { setError(`读取小镇设置失败：${e.message}`); }
      }, []);
      React.useEffect(() => { load(); }, [load]);
      React.useEffect(() => { const timer = setInterval(load, 5000); return () => clearInterval(timer); }, [load]);
      const save = async patch => {
        setBusy(true); setMessage('');
        try {
          const result = await post(patch);
          setConfig(plainConfig(result.config || config));
          setState(result.state || state);
          setMessage('已保存');
          setError('');
        } catch (e) { setMessage(`保存失败：${e.message}`); }
        finally { setBusy(false); }
      };
      if (!config) return h('div', { 'data-tl': '' }, error || '正在读取小镇…');
      const cell = (key, label, value) => h('div', { 'data-tl-cell': '', key }, h('span', { 'data-tl-k': '' }, label), h('span', { 'data-tl-v': '' }, value ?? '—'));
      return h('div', { 'data-tl': '' },
        h('style', null, styles),
        h('div', { 'data-tl-panel': '' },
          h('div', { 'data-tl-row': '' },
            h('strong', { 'data-tl-grow': '', 'data-tl-title': '' }, '橡溪镇 · 此刻'),
            h('a', { 'data-tl-btn': '', href: config.dashboard, target: '_blank', rel: 'noreferrer' }, '打开实时地图'),
            h('button', { 'data-tl-btn': '', disabled: busy, onClick: load }, '刷新')),
          h('div', { 'data-tl-grid': '' },
            cell('location', '当前位置', state?.location),
            cell('phase', '正在做什么', state?.phase),
            cell('coins', '小镇币', state?.coins),
            cell('energy', '精力', state?.energy),
            cell('mood', '心情', state?.mood),
            cell('locations', '地点', state?.locations),
            cell('shops', '商店', state?.shops),
            cell('npcs', '居民', state?.npcs),
            cell('clock', '小镇时间', state?.clock),
            cell('fullness', '饱食感', state?.fullness),
            cell('tone', '说话口气', state?.tone),
            cell('activity', '正在忙', state?.activity || '没有'),
            cell('field', '小院田地', state?.field)),
          state?.error ? h('div', { 'data-tl-note': '' }, `状态读取失败：${state.error}`) : null,
          h('div', { 'data-tl-note': '' }, '地图每 ' + (config.mapRefreshSeconds ?? 2) + ' 秒刷新一次，与她对话共用同一份存档。')),
        h('div', { 'data-tl-panel': '' },
          h('div', { 'data-tl-title': '' }, '生活线开关'),
          h(CheckSetting, { config, save, busy, field: 'enabled', label: '启用橡溪镇生活线', note: '关闭后工具、地图和设置面板都不再工作。' }),
          h(CheckSetting, { config, save, busy, field: 'allowFreeActions', label: '允许记录自由行动', note: '把你或主角随口说出的行动记进生活线。' }),
          h(CheckSetting, { config, save, busy, field: 'showNpcDetails', label: '显示居民细节', note: '在地图和状态里显示 NPC 的位置、职业、活动和关系。' }),
          h(CheckSetting, { config, save, busy, field: 'showDecorDetails', label: '显示家具细节', note: '显示家具的房间、坐标和旋转角度。' }),
          h(SelectSetting, { config, save, busy, field: 'eventMode', label: '事件模式', options: [{ value: 'daily', label: '每日一场事件' }, { value: 'occasional', label: '同日偶然事件' }, { value: 'surprise', label: '突发事件为主' }] }),
          h(SelectSetting, { config, save, busy, field: 'townScale', label: '小镇规模', options: [{ value: 'expanded', label: '完整生活设施（14 地点）' }, { value: 'compact', label: '基础六地点' }] })),
        h('div', { 'data-tl-panel': '' },
          h('div', { 'data-tl-title': '' }, '小镇与小屋'),
          h(TextSetting, { config, save, busy, field: 'homeName', label: '小屋名称' }),
          h(TextSetting, { config, save, busy, field: 'weatherCity', label: '天气城市', note: '只取城市级天气，不需要精确住址。' }),
          h(TextSetting, { config, save, busy, field: 'defaultDecorRoom', label: '默认布置房间' }),
          h(TextSetting, { config, save, busy, field: 'avatarImageUrl', label: '自定义头像地址', note: '留空使用内置头像。', wide: true }),
          h(NumberSetting, { config, save, busy, field: 'startingCoins', label: '初始小镇币', min: 0, max: 99999 }),
          h(NumberSetting, { config, save, busy, field: 'mapRefreshSeconds', label: '地图刷新间隔（秒）', min: 1, max: 60 }),
          h('div', { 'data-tl-row': '' },
            h('button', { 'data-tl-btn': '', disabled: busy, onClick: () => save({ enabled: true, eventMode: 'daily', allowFreeActions: true, showNpcDetails: true, showDecorDetails: true, townScale: 'expanded', mapRefreshSeconds: 2, defaultDecorRoom: '小书桌与日记本', weatherCity: '成都', homeName: '月镜湖·芦苇湾' }) }, '恢复推荐值'),
            h('span', { 'data-tl-note': '' }, message || error))));
    }
    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section', id: 'town-life', order: 76, label: () => '橡溪镇',
        }, Panel));
      },
    };
  },
});
