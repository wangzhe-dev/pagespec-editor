# Data Model

核心结构改为 NodeTree：

- `spec = { version, rootId, nodes, meta }`
- `Node = ContainerNode | LeafNode`
- `SlotContent = empty | single | grid`
- `grid` 通过 `items` 保存 `itemId/childId/x/y/w/h`
- `leafMeta` 只在 leaf 中存在，包含 `componentRef/description/fields/recipes`
