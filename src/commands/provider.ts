import type { KCommand } from '../types'
import * as path from 'node:path'
import * as vscode from 'vscode'
import { createAndOpenFile } from '../utils/file'
import input from '../utils/input'
import { firstLower } from '../utils/textUtils'

export default <KCommand>{
  callback: async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder open')
      return
    }

    const result = await input({
      entityName: {
        prompt: 'Enter the entity name',
        required: true,
        title: 'Entity Name',
      },
      isCollection: {
        default: 'true',
        prompt: 'Is this a collection provider?',
        required: true,
        title: 'Is Collection',
        type: 'boolean',
      },
      providerName: {
        prompt: 'Enter the provider name without the Provider suffix',
        require: true,
        title: 'Provider Name',
      },
    })

    if (result instanceof Error) {
      return
    }

    let { entityName, isCollection, providerName } = result

    providerName += (isCollection ? 'Collection' : '')
    const queryName = `${providerName}Query`

    const folderPath = workspaceFolders[0].uri.fsPath

    // ! PROVIDER
    const providerFilePath = path.join(folderPath, 'src/ApiResource/State/', entityName, `${providerName}Provider.php`)
    await createAndOpenFile(providerFilePath, `<?php

declare(strict_types=1);

namespace App\\ApiResource\\State${entityName ? `\\${entityName}` : ''};

use ApiPlatform\\Metadata\\Operation;
use App\\ApiResource\\State\\AbstractStateProvider;
use App\\Entity\\User;
use App\\Query${entityName ? `\\${entityName}` : ''}\\${queryName};
${entityName ? `use App\\Entity\\${entityName};\n` : ''}
/**
 * @extends AbstractStateProvider<${entityName ?? 'mixed'}>
 */
final class ${providerName}Provider extends AbstractStateProvider
{
    /**
     * @return ${entityName ?? 'mixed'}${isCollection ? '[]' : ''}
     */
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): ${isCollection ? 'array' : 'object'}
    {
        return $this->getResults(${entityName ?? 'mixed'}::class, new ${queryName}($uriVariables), $operation, $context);
    }
}
`)

    // ! QUERY
    const queryFilePath = path.join(folderPath, 'src/Query/', entityName, `${queryName}.php`)
    await createAndOpenFile(queryFilePath, `<?php

declare(strict_types=1);

namespace App\\Query${entityName ? `\\${entityName}` : ''};

use App\\Entity\\User;

final readonly class ${queryName}
{
    public function __construct(
        public array $uriVariables,
    ) {
    }
}
`)

    // ! QUERY HANDLER
    const queryHandlerFilePath = path.join(folderPath, 'src/Query/', entityName, `${queryName}Handler.php`)
    await createAndOpenFile(queryHandlerFilePath, `<?php

declare(strict_types=1);

namespace App\\Query${entityName ? `\\${entityName}` : ''};
${entityName ? `\nuse App\\Repository\\${entityName}Repository;` : ''}
use Doctrine\\ORM\\QueryBuilder;
use Symfony\\Component\\Messenger\\Attribute\\AsMessageHandler;

#[AsMessageHandler]
final readonly class ${queryName}Handler
{
    public function __construct(${entityName ? `\nprivate ${entityName}Repository $${firstLower(entityName)}Repository\n` : ''}) {
    }

    /**
     * @param ${queryName} $query
     *
     * @return QueryBuilder
     */
    public function __invoke(${queryName} $query): QueryBuilder
    {
        $uriVariables = $query->uriVariables;

        return $this->${firstLower(entityName)}Repository->createQueryBuilder('${firstLower(entityName)}');
    }
}
`)
  },
  name: 'provider',
}
