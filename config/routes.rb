# config/routes.rb
Rails.application.routes.draw do
  root "home#index"
  resources :posts, only: [ :index ]

  namespace :admin do
    get "login", to: "sessions#new"
    post "login", to: "sessions#create"
    delete "logout", to: "sessions#destroy"
    resources :posts, only: [ :new, :create, :destroy ]  # destroyを追加
  end
end
