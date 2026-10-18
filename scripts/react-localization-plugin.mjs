/** Build-time JSX adapter. DOM elements keep their original props, keys and refs.
 * Library composition (Radix asChild), native SVG, lazy routes and portals remain React-owned.
 */
export default function reactLocalization({ types: t }) {
  return { visitor: {
    Program: {
      enter(path, state) {
        const filename = state.filename.replaceAll('\\', '/');
        state.localize = filename.includes('/src/') && !filename.endsWith('/language/LocalizedElement.tsx');
        state.usedLocalization = false;
        state.localizeId = path.scope.generateUidIdentifier('LocalizedElement');
      },
      exit(path, state) {
        if (state.usedLocalization) path.unshiftContainer('body', t.importDeclaration([
          t.importSpecifier(state.localizeId, t.identifier('LocalizedElement')),
        ], t.stringLiteral('@/shared/language/LocalizedElement')));
      },
    },
    JSXElement: { exit(path, state) {
      if (!state.localize) return;
      const name = path.node.openingElement.name;
      // ThemedSelect inspects native option elements before rendering its Radix items.
      if(t.isJSXIdentifier(name) && ['option','tr'].includes(name.name)) return;
      const native = t.isJSXIdentifier(name) && /^[a-z]/.test(name.name);
      const motion = t.isJSXMemberExpression(name) && t.isJSXIdentifier(name.object, { name: 'motion' });
      const link = t.isJSXIdentifier(name) && ['Link', 'NavLink'].includes(name.name);
      const primitive = t.isJSXMemberExpression(name) && t.isJSXIdentifier(name.object) && (/Primitives?$/.test(name.object.name) || name.object.name==='Dialog');
      if (!native && !motion && !link && !primitive) return;
      const as = native ? t.stringLiteral(name.name) : link ? t.identifier(name.name) : t.memberExpression(t.identifier(name.object.name), t.identifier(name.property.name));
      path.node.openingElement.name = t.jsxIdentifier(state.localizeId.name);
      path.node.openingElement.attributes.unshift(t.jsxAttribute(t.jsxIdentifier('as'), t.jsxExpressionContainer(as)));
      if (path.node.closingElement) path.node.closingElement.name = t.jsxIdentifier(state.localizeId.name);
      state.usedLocalization = true;
    } },
  } };
}
