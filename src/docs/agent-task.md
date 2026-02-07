# Agent Task

当前编辑器以 NodeTree 为唯一真相：

- UI 不直接修改节点树，所有改动必须经过 `core/ops/*`。
- Slot 统一三态：`empty/single/grid`，并支持 `single -> grid` 自动升级与 `grid -> single` 自动降级。
- `vue-grid-layout` 仅作为 Grid 的渲染投影层，事件只回写 `grid.items` 几何。
- Prompt 输出顺序固定：`Deliverables -> Hard Rules -> DSL -> Leaf Details -> Checklist`。
