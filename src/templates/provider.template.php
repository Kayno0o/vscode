<?php

declare(strict_types=1);

namespace App\ApiResource\State\{{ENTITY_NAME}};

use ApiPlatform\Metadata\Operation;
use App\ApiResource\State\AbstractStateProvider;
use App\Entity\User;
use App\Query\{{ENTITY_NAME}}\{{QUERY_NAME}};
{{USE_ENTITY}}
/**
 * @extends AbstractStateProvider<{{OUTPUT_CLASS}}|object>
 */
class {{PROVIDER_NAME}} extends AbstractStateProvider
{
    /**
     * @return array<{{OUTPUT_CLASS}}>|object
     */
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object | array
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            return [];
        }

        return $this->getResults({{OUTPUT_CLASS}}::class, new {{QUERY_NAME}}($user), $operation, $context);
    }
}
