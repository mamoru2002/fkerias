class Admin::PostsController < ApplicationController
  before_action :require_admin

  def new
    @post = Post.new
  end

  def create
    @post = Post.new(post_params)

    # デバッグ用にログを追加
    Rails.logger.debug "Post params: #{post_params.inspect}"
    Rails.logger.debug "Post valid?: #{@post.valid?}"
    Rails.logger.debug "Post errors: #{@post.errors.full_messages}" if @post.invalid?

    if @post.save
      redirect_to posts_path, notice: "Post was successfully created"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    @post = Post.find(params[:id])
    @post.destroy
    redirect_to posts_path, notice: "投稿を削除しました"
  end

  private

  def post_params
    params.require(:post).permit(:content)
  end

  def require_admin
    unless session[:admin]
      redirect_to root_path
    end
  end
end
