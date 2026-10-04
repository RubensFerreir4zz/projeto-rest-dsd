class HateoasBuilder:

    @staticmethod
    def file_links(file_id: int, request=None) -> dict:
        base_url = "/api/drive/files"
        return {
            "self": {
                "href": f"{base_url}/{file_id}/",
                "method": "GET",
                "description": "Obter metadados detalhados deste arquivo"
            },
            "download": {
                "href": f"{base_url}/{file_id}/download/",
                "method": "GET",
                "description": "Baixar o arquivo em anexo"
            },
            "preview": {
                "href": f"{base_url}/{file_id}/preview/",
                "method": "GET",
                "description": "Visualizar arquivo inline (imagem/pdf/áudio)"
            },
            "delete": {
                "href": f"{base_url}/{file_id}/",
                "method": "DELETE",
                "description": "Excluir permanentemente este arquivo e liberar cota"
            }
        }

    @staticmethod
    def user_profile_links(user_id: int, has_space: bool = True) -> dict:
        links = {
            "self": {
                "href": "/api/me/",
                "method": "GET",
                "description": "Consultar dados da conta e cota atual"
            },
            "list_files": {
                "href": "/api/drive/files/",
                "method": "GET",
                "description": "Listar todos os arquivos deste usuário"
            }
        }
        if has_space:
            links["upload_file"] = {
                "href": "/api/drive/files/",
                "method": "POST",
                "description": "Enviar um novo arquivo para o drive"
            }

        return links

    @staticmethod
    def enrich_file(file_data: dict, request=None) -> dict:
        file_copy = dict(file_data)
        file_copy["_links"] = HateoasBuilder.file_links(file_copy.get("id"), request)
        return file_copy

    @staticmethod
    def enrich_file_list(files_list: list, request=None) -> list:
        return [HateoasBuilder.enrich_file(f, request) for f in files_list]
