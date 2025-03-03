import type { KCommand } from '../types'
import * as path from 'node:path'
import * as vscode from 'vscode'
import { createAndOpenFile } from '../utils/file'
import input from '../utils/input'

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
      processorName: {
        prompt: 'Enter the processor name without the Processor suffix',
        required: true,
        title: 'Processor Name',
      },
    })

    if (result instanceof Error) {
      return
    }

    let { entityName, processorName } = result

    processorName = processorName.replace(/Processor$/, '')

    const folderPath = workspaceFolders[0].uri.fsPath

    const commandName = `Process${processorName}Command`

    const filePath = path.join(folderPath, 'src', 'ApiResource', 'State', entityName, `${processorName}Processor.php`)
    await createAndOpenFile(filePath, `<?php

declare(strict_types=1);

namespace App\\ApiResource\\State\\${entityName};

use ApiPlatform\\Metadata\\Operation;
use App\\ApiResource\\State\\AbstractStateProcessor;
use App\\Entity\\User;
use App\\Entity\\${entityName};
use App\\Command\\${entityName}\\${commandName};

/**
 * @extends AbstractStateProcessor<${entityName}, ${entityName}>
 */
final class ${processorName}Processor extends AbstractStateProcessor
{
    /**
     * @param ${entityName} $data
     *
     * @return ${entityName}
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ${entityName}
    {
      return $this->executeCommand(new ${commandName}(data: $data, uriVariables: $uriVariables));
    }
}
`)

    // create symfony command and command handler
    const commandFilePath = path.join(folderPath, 'src', 'Command', entityName, `${commandName}.php`)
    await createAndOpenFile(commandFilePath, `<?php

declare(strict_types=1);

namespace App\\Command\\${entityName};

use App\\Entity\\${entityName};

final readonly class ${commandName}
{
    public function __construct(
        public ${entityName} $data,
        public array $uriVariables,
    ) {
    }
}
`)

    const commandHandlerFilePath = path.join(folderPath, 'src', 'Command', entityName, `${commandName}Handler.php`)
    await createAndOpenFile(commandHandlerFilePath, `<?php

declare(strict_types=1);

namespace App\\Command\\${entityName};

use App\\Entity\\${entityName};
use Symfony\\Component\\Messenger\\Attribute\\AsMessageHandler;

#[AsMessageHandler]
final readonly class ${commandName}Handler
{
    public function __construct(
    ) {
    }

    public function __invoke(${commandName} $command): void
    {
    }
}
`)
  },
  name: 'processor',
}
