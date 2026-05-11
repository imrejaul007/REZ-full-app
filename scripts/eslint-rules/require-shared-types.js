/**
 * ESLint rule: Error if defining common types locally that should come from @rez/shared-types
 *
 * This rule enforces using @rez/shared-types for shared domain types to prevent
 * duplication and ensure consistency across the monorepo.
 */

const SHARED_TYPES_PACKAGE = '@rez/shared-types';

// Interfaces that MUST come from shared-types
const FORBIDDEN_INTERFACES = [
  'User',
  'Order',
  'Product',
  'Payment',
  'Wallet',
];

// Enums that MUST come from shared-types
const FORBIDDEN_ENUMS = [
  'OrderStatus',
  'PaymentMethod',
];

// Type aliases that MUST come from shared-types
const FORBIDDEN_TYPE_ALIASES = [
  'UserId',
  'OrderId',
  'ProductId',
  'PaymentId',
  'WalletId',
  'Money',
  'Currency',
];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Error if defining common types locally that should come from @rez/shared-types',
      category: 'Errors',
      recommended: true,
    },
    schema: [],
    fixable: null,
  },

  create(context) {
    const sourceCode = context.getSourceCode();
    const filename = context.getFilename();

    return {
      // Error on interface declarations
      TSInterfaceDeclaration(node) {
        const interfaceName = node.id.name;

        if (FORBIDDEN_INTERFACES.includes(interfaceName)) {
          context.report({
            node,
            message: `Do not define '${interfaceName}' locally. Import it from '${SHARED_TYPES_PACKAGE}': ` +
              `import { ${interfaceName} } from '${SHARED_TYPES_PACKAGE}';`,
          });
        }
      },

      // Error on enum declarations
      TSEnumDeclaration(node) {
        const enumName = node.id.name;

        if (FORBIDDEN_ENUMS.includes(enumName)) {
          context.report({
            node,
            message: `Do not define '${enumName}' locally. Import it from '${SHARED_TYPES_PACKAGE}': ` +
              `import { ${enumName} } from '${SHARED_TYPES_PACKAGE}';`,
          });
        }
      },

      // Error on type alias declarations for forbidden types
      TSTypeAliasDeclaration(node) {
        const typeName = node.id.name;

        if (FORBIDDEN_TYPE_ALIASES.includes(typeName)) {
          context.report({
            node,
            message: `Do not define '${typeName}' locally. Import it from '${SHARED_TYPES_PACKAGE}': ` +
              `import { ${typeName} } from '${SHARED_TYPES_PACKAGE}';`,
          });
        }
      },
    };
  },
};
