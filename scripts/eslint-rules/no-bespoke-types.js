/**
 * ESLint rule: Warn when local type definitions exist that should come from @rez/shared-types
 *
 * This rule warns developers when they define types locally that are likely duplicates
 * of types available in @rez/shared-types package.
 */

const SHARED_TYPES_PACKAGE = '@rez/shared-types';

// Types that should be imported from shared-types
const SUSPICIOUS_TYPES = [
  'User',
  'Order',
  'Product',
  'Payment',
  'Wallet',
  'OrderStatus',
  'PaymentMethod',
  'UserRole',
  'Address',
  'Cart',
  'CartItem',
];

// Suspicious enum names
const SUSPICIOUS_ENUMS = [
  'OrderStatus',
  'PaymentMethod',
  'UserRole',
  'OrderType',
  'PaymentStatus',
  'ShippingMethod',
];

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Warn when local type definitions exist that should come from @rez/shared-types',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    fixable: null,
  },

  create(context) {
    return {
      // Warn on interface declarations
      TSInterfaceDeclaration(node) {
        const interfaceName = node.id.name;

        if (SUSPICIOUS_TYPES.includes(interfaceName)) {
          context.report({
            node,
            message: `Avoid defining '${interfaceName}' locally. Import it from '${SHARED_TYPES_PACKAGE}' instead: ` +
              `import { ${interfaceName} } from '${SHARED_TYPES_PACKAGE}';`,
          });
        }
      },

      // Warn on type alias declarations
      TSTypeAliasDeclaration(node) {
        const typeName = node.id.name;

        if (SUSPICIOUS_TYPES.includes(typeName)) {
          context.report({
            node,
            message: `Avoid defining '${typeName}' locally. Import it from '${SHARED_TYPES_PACKAGE}' instead: ` +
              `import { ${typeName} } from '${SHARED_TYPES_PACKAGE}';`,
          });
        }
      },

      // Warn on enum declarations
      TSEnumDeclaration(node) {
        const enumName = node.id.name;

        if (SUSPICIOUS_ENUMS.includes(enumName)) {
          context.report({
            node,
            message: `Avoid defining '${enumName}' locally. Import it from '${SHARED_TYPES_PACKAGE}' instead: ` +
              `import { ${enumName} } from '${SHARED_TYPES_PACKAGE}';`,
          });
        }
      },
    };
  },
};
