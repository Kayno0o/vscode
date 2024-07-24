import * as path from 'node:path'
import * as vscode from 'vscode'
import type { KCommand } from '../types'
import input from '../utils/input'
import { firstLower } from '../utils/textUtils'

const provider: KCommand = {
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

    const { entityName, isCollection, providerName } = result

    const folderPath = workspaceFolders[0].uri.fsPath

    const providerFilePath = path.join(folderPath, 'src/ApiResource/State/', entityName, `${providerName}Provider.php`)
    const providerUri = vscode.Uri.file(providerFilePath)

    const queryName = `${providerName}${isCollection ? 'Collection' : ''}Query`

    vscode.workspace.fs.writeFile(providerUri, new TextEncoder().encode(
      `<?php

declare(strict_types=1);

namespace App\\ApiResource\\State${entityName ? `\\${entityName}` : ''};

use ApiPlatform\\Metadata\\Operation;
use App\\ApiResource\\State\\AbstractStateProvider;
use App\\Entity\\User;
use App\\Query${entityName ? `\\${entityName}` : ''}\\${queryName};
${entityName ? `use App\\Entity\\${entityName};\n` : ''}
/**
 * @extends AbstractStateProvider<${entityName ?? 'mixed'}|object>
 */
class ${providerName} extends AbstractStateProvider
{
    /**
     * @return array<${entityName ?? 'mixed'}>|object
     */
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object | array
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            return [];
        }

        return $this->getResults(${entityName ?? 'mixed'}::class, new ${queryName}($user), $operation, $context);
    }
}
`,
    ))

    const queryFilePath = path.join(folderPath, 'src/Query/', entityName, `${queryName}.php`)
    const queryUri = vscode.Uri.file(queryFilePath)

    vscode.workspace.fs.writeFile(queryUri, new TextEncoder().encode(
      `<?php

declare(strict_types=1);

namespace App\\Query${entityName ? `\\${entityName}` : ''};

use App\\Entity\\User;

readonly class ${queryName}
{
    public function __construct(
        public User $user,
    ) {
    }
}
`,
    ))

    const queryHandlerFilePath = path.join(folderPath, 'src/QueryHandler/', entityName, `${queryName}Handler.php`)
    const queryHandlerUri = vscode.Uri.file(queryHandlerFilePath)

    vscode.workspace.fs.writeFile(queryHandlerUri, new TextEncoder().encode(
      `<?php

declare(strict_types=1);

namespace App\\Query${entityName ? `\\${entityName}` : ''};
${entityName ? `\nuse App\\Repository\\${entityName}Repository;` : ''}
use Doctrine\\ORM\\QueryBuilder;
use Symfony\\Component\\Messenger\\Attribute\\AsMessageHandler;

#[AsMessageHandler]
class ${queryName}Handler
{
    public function __construct(${entityName ? `\npublic readonly ${entityName}Repository $${firstLower(entityName)}Repository\n` : ''}) {
    }

    /**
     * @param ${queryName} $query
     *
     * @return QueryBuilder
     */
    public function __invoke(${queryName} $query): QueryBuilder
    {
        $user = $query->user;
        return $this->${firstLower(entityName)}Repository->findAll();
    }
}
`,
    ))
  },
  name: 'provider',
}

export default provider
