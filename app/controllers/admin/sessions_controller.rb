class Admin::SessionsController < ApplicationController
  def new
  end

  def create
    if params[:password] == ENV["ADMIN_PASSWORD"]
      session[:admin] = true
      redirect_to new_admin_post_path, notice: "Logged in successfully"
    else
      flash.now[:alert] = "Invalid password"
      render :new
    end
  end
  def destroy
    session[:admin] = nil
    redirect_to root_path, notice: "\u30ED\u30B0\u30A2\u30A6\u30C8\u3057\u307E\u3057\u305F"
  end
end
