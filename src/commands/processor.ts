import type { KCommand } from '../types'
import * as path from 'node:path'
import * as vscode from 'vscode'
import input from '../utils/input'

const processor: KCommand = {
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

    const { entityName, processorName } = result

    const folderPath = workspaceFolders[0].uri.fsPath
    const filePath = path.join(folderPath, 'src/ApiResource/State/', entityName, `${processorName}Processor.php`)

    vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), new TextEncoder().encode(
      `<?php

declare(strict_types=1);

namespace App\\ApiResource\\State${entityName ? `\\${entityName}` : ''};

use ApiPlatform\\Metadata\\Operation;
use App\\ApiResource\\State\\AbstractStateProcessor;
use App\\Entity\\User;
${entityName ? `use App\\Entity\\${entityName};\n` : ''}
/**
 * @extends AbstractStateProcessor<${entityName ?? 'Input'}, ${entityName ?? 'Ouput'}>
 */
final class ${processorName}Processor extends AbstractStateProcessor
{
    /**
     * @param ${entityName ?? 'Input'} $data
     *
     * @return ${entityName ?? 'Ouput'}
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ${entityName ?? 'Ouput'}
    {
      $this->entityManager->persist($data);
      $this->entityManager->flush();

      return $data;
    }
}
`,
    ))
  },
  name: 'processor',
}

export default processor
