namespace :data do
    desc 'Load data from JSON seed model app'
    task load_data_app: :environment do
        file_path = Rails.root.join('teleatiendo', 'data_app.json')
        file = File.read(file_path)
        data = JSON.parse(file)
        data.each do |item|
            app_created = App.create(item)
            role = app_created.roles.find_or_initialize_by(agent_id: item['owner_id'])
            role.save
        end
        puts 'La data fue cargada satisfactoriamente.'
    end

    desc 'Load data from JSON seed model campaigns'
    task load_data_campaigns: :environment do
        BotTask.delete_all
        file_path = Rails.root.join('teleatiendo', 'data_campaigns.json')
        file = File.read(file_path)
        data = JSON.parse(file)
    
        data.each do |item|
            BotTask.create(item)
        end
        # Obtener el último valor de la secuencia campaigns_id_seq
        last_value = ActiveRecord::Base.connection.execute("SELECT MAX(id) FROM campaigns").first['max'].to_i

        # Actualizar el valor actual de la secuencia campaigns_id_seq
        ActiveRecord::Base.connection.execute("SELECT setval('campaigns_id_seq', #{last_value})")
        puts "Registros guardados exitosamente"
                  
    end
end
  
